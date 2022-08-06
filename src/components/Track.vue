<script setup lang="ts">
import NumberListInput from "./NumberListInput.vue";
import type { Preset, SongData } from "@/model/types";
import { noteNumberToName } from "@/model/engine";
import type { TrackModel } from "@/model/TrackModel";
import PresetSelect from "./PresetSelect.vue";
import ConfirmButton from "./ConfirmButton.vue";

interface Props {
  track: TrackModel
  songData: SongData
  device: MIDIOutput
  clock: number
  clockStart: number
  removeTrack: () => void
  viewType: string
}

interface Data {
  lastNotes: number[]
  preset?: Preset
  localViewType: string
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import { presets } from "@/model/presets";

export default defineComponent({
  data(): Data {
    return {
      lastNotes: [],
      localViewType: ""
    }
  },
  methods: {
    cycleView() {
      if (!this.localViewType) {
        this.localViewType = 'expand'
      } else if (this.localViewType === 'expand') {
        this.localViewType = 'perf';
      } else if (this.localViewType === 'perf') {
        this.localViewType = '';
      }
    }
  },
  computed: {
    availableNotes: function () {
      return this.$props.track.availableNotes(this.songData);
    },
    rythmDefinitionComputed: {
      get() {
        return this.$props.track.rythmDefinition.join(" ");
      },
      set(newValue: string) {
        this.$props.track.rythmDefinition = newValue.split(" ").map((val: string) => parseInt(val, 10));
      }
    },
    computedView: function() {
      return this.localViewType ? this.localViewType : this.$props.viewType;
    }
  },
  watch: {
    device(newDevice: MIDIOutput) {
      this.$props.track.device = newDevice;
    },
    clock(newClock: number) {
      if (this.$props.track.division === 0) return;
      this.$props.track.position = Math.trunc(newClock / this.$props.track.division);
      if (!this.$props.track.playing) return;
      if (newClock % this.$props.track.division === 0) {
        if (this.$props.track.gate === 100) this.$props.track.stop();
        this.$props.track.emit(this.$props.songData);
      } else if (this.$props.track.gate < 100) {
        const pcLow = ((newClock % this.$props.track.division) / this.$props.track.division) * 100;
        const pcHigh = (((newClock + 1) % this.$props.track.division) / this.$props.track.division) * 100;
        if (pcHigh < pcLow || pcLow < this.$props.track.gate && pcHigh >= this.$props.track.gate) {
          this.$props.track.stop();
        }
      }
    },
    'track.channel'(newChannel: number, oldChannel: number) {
      this.$props.track.stop();
    },
    'songData.currentChord'(newChord: number) {
      if (!this.$props.track.playing) return;
      if (this.$props.track.division === 0) {
        this.$props.track.stop();
        this.$props.track.emit(this.$props.songData);
      }
    },
    'songData.currentChordType'(newChord: number) {
      if (!this.$props.track.playing) return;
      if (this.$props.track.division === 0) {
        this.$props.track.stop();
        this.$props.track.emit(this.$props.songData);
      }
    }
  },
  beforeUnmount() {
    this.$props.track.fullStop(true);
  }
});
</script>

<template>
  <div class="row">
    <div class="col-12">
      <div class="row">
        <div class="col-2">
          <div class="btn-group" role="group">
            <button @click="$props.track.playpause" class="btn btn-outline-primary playpause-track" title="Play/Pause track">
              <i :class="'bi bi-' + ($props.track.playing ? 'pause' : 'play') + '-fill'"></i>
            </button>
            <ConfirmButton label="Remove track" @confirmed="removeTrack">
              <i class="bi bi-trash-fill"></i>
            </ConfirmButton>
            <button class="btn btn-outline-primary change-track-view" @click="cycleView">
              <i class="bi bi-eye-fill"></i>
            </button>
          </div>
        </div>
        <div class="col-4">
          <div class="input-group" role="group">
            <span class="input-group-text">Channel</span>
            <input class="form-control form-control-sm choose-track-channel" type="number" v-model="$props.track.channel" title="MIDI Channel driven by this track"/>
            <span class="input-group-text">Vol.</span>
            <input class="form-control choose-track-base-velocity" type="number" v-model="$props.track.baseVelocity" />
          </div>
        </div>
        <div class="col-6">
          <div class="choose-track-preset">
            <PresetSelect :data="presets" :selectedCategory="$props.track.presetCategory"
              :selectedPreset="$props.track.presetId" @preset-change="(newPreset) => { $props.track.presetChange(newPreset); }" />
          </div>
        </div>
      </div>
    </div>
    <div class="col-12" v-if="computedView === 'expand'">
      <div class="row">
        <div class="col-6">
          <div class="edit-track-notes input-group">
            <span class="input-group-text">Degrees</span>
            <NumberListInput v-model="$props.track.availableDegrees" />
            <span class="input-group-text">{{ [...new Set(availableNotes)].map((val: number) => noteNumberToName(val)).join(" ") }}</span>
          </div>
        </div>
        <div class="col-6">
          <div class="input-group" role="group">
            <select class="form-select choose-track-play-mode" v-model="$props.track.playMode">
              <option value="nil">----</option>
              <option value="up">Up</option>
              <option value="dn">Down</option>
              <option value="updn">UpDown</option>
              <option value="random">Random</option>
              <option value="atonce">Chord</option>
              <option value="strum">Strum</option>
            </select>
            <select class="form-select choose-track-related-to" v-model="$props.track.relatedTo">
              <option value="nil">----</option>
              <option value="scale">Scale</option>
              <option value="chord">Chord</option>
              <option value="invchord">Chord (Inv.)</option>
              <option value="static">Static</option>
            </select>
            <span class="input-group-text">Gravity</span>
            <input class="form-control choose-track-gravity-center" type="number" v-model="$props.track.gravityCenter" />
            <input class="form-control choose-track-gravity-strength" type="number" v-model="$props.track.gravityStrength" />
          </div>
        </div>
      </div>
    </div>
    <div class="col-12" v-if="computedView === 'expand'">
      <div class="row">
        <div class="col-8">
          <div class="edit-track-rythm input-group">
            <span class="input-group-text">Rythm</span>
            <NumberListInput v-model="$props.track.rythmDefinition" /><br />
          </div>
        </div>
        <div class="col-4">
          <div class="input-group" role="group">
            <span class="input-group-text">Div.</span>
            <input class="form-control choose-track-division" type="number" v-model="$props.track.division" />
          </div>
        </div>
      </div>
      <div class="col-12" v-if="computedView === 'expand'">
        <div class="input-group input-group">
          <span class="input-group-text">Density</span>
          <input class="form-control" type="number" v-model="$props.track.rythmDensity" />
          <span class="input-group-text">Proba.</span>
          <input class="form-control" type="number" v-model="$props.track.proba" />
          <span class="input-group-text">V.Ampl.</span>
          <input class="form-control" type="number" v-model="$props.track.velAmplitude" />
          <span class="input-group-text">V.Center</span>
          <input class="form-control" type="number" v-model="$props.track.velCenter" />
        </div>
      </div>
      <div class="col-12" v-if="computedView === 'expand'">
        <div class="row">
          <div class="col-2">
            <div class="input-group" role="group">
              <span class="input-group-text">Strum</span>
              <input class="form-control" type="number" v-model="$props.track.strumDelay" />
            </div>
          </div>
          <div class="col-2">
            <div class="input-group" role="group">
              <span class="input-group-text">Gate</span>
              <input class="form-control" type="number" v-model="$props.track.gate" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-12" v-if="computedView === 'perf'">
      <div class="row">
        <div class="col-3">
          <div class="input-group" role="group">
            <span class="input-group-text">Gravity</span>
            <input class="form-control" type="number" v-model="$props.track.gravityCenter" />
            <input class="form-control" type="number" v-model="$props.track.gravityStrength" />
          </div>
        </div>
        <div class="col-9">
          <div class="input-group input-group">
            <span class="input-group-text">Div.</span>
            <input class="form-control" type="number" v-model="$props.track.division" />
            <span class="input-group-text">Density</span>
            <input class="form-control" type="number" v-model="$props.track.rythmDensity" />
            <span class="input-group-text">Proba.</span>
            <input class="form-control" type="number" v-model="$props.track.proba" />
            <span class="input-group-text">V.Ampl.</span>
            <input class="form-control" type="number" v-model="$props.track.velAmplitude" />
            <span class="input-group-text">V.Center</span>
            <input class="form-control" type="number" v-model="$props.track.velCenter" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>

tr {
  vertical-align: top;
}
</style>
