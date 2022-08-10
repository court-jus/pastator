<script setup lang="ts">
import NumberListInput from "./NumberListInput.vue";
import type { Preset, SongData } from "@/model/types";
import { noteNumberToName } from "@/model/engine";
import type { TrackModel, RythmMode } from "@/model/TrackModel";
import PresetSelect from "./PresetSelect.vue";
import ConfirmButton from "./ConfirmButton.vue";
import StepsSequencer from "./StepsSequencer.vue";
import RythmPresetSelector from "./RythmPresetSelector.vue";
import NotesPresetSelector from "./NotesPresetSelector.vue";
import Slider from "./Slider.vue";

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
    },
    notesIndicator: function() {
      const availableNotesNames = [...new Set(this.availableNotes)].map((val: number) => noteNumberToName(val));
      const [lowLimit, highLimit] = this.$props.track.getNotesLimits().map((val: number) => noteNumberToName(val));
      const notes = [];
      if (lowLimit) notes.push(lowLimit, "|");
      notes.push(...availableNotesNames);
      if (highLimit) notes.push("|", highLimit);
      return notes.join(" ");
    }
  },
  watch: {
    device(newDevice: MIDIOutput) {
      this.$props.track.device = newDevice;
    },
    clock(newClock: number) {
      this.$props.track.tick(newClock, this.$props.songData);
    },
    'track.channel'() {
      this.$props.track.stop();
    },
    'songData.currentChord'() {
      this.$props.track.currentChordChange(this.$props.songData);
    },
    'songData.currentChordType'() {
      this.$props.track.currentChordChange(this.$props.songData);
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
            <button @click="() => $props.track.playpause($props.songData)" class="btn btn-outline-primary playpause-track" title="Play/Pause track">
              <i :class="'bi bi-' + ($props.track.playing ? 'pause' : 'play') + '-fill'"></i>
            </button>
            <ConfirmButton label="Remove track" @confirmed="removeTrack">
              <i class="bi bi-trash-fill"></i>
            </ConfirmButton>
            <button class="btn btn-outline-primary change-track-view" @click="cycleView">
              <i class="bi bi-eye-fill"></i>
            </button>
            <button class="btn btn-outline-primary" @click="$props.track.addSingleShot">
              <i class="bi bi-eye-fill" v-if="$props.track.singleShots === undefined"></i>
              <span v-else>{{ $props.track.singleShots }}</span>
            </button>
          </div>
        </div>
        <div class="col-4">
          <div class="input-group" role="group">
            <span class="input-group-text">Channel</span>
            <input class="form-control form-control-sm choose-track-channel" type="number" min="0" max="15" v-model="$props.track.channel" title="MIDI Channel driven by this track"/>
            <span class="input-group-text">Vol.</span>
            <input class="form-control choose-track-base-velocity" type="number" min="0" max="100" v-model="$props.track.baseVelocity" />
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
            <select class="input-group-text form-select" v-model="$props.track.notesMode">
              <option value="manual">Manual</option>
              <option value="preset">Preset</option>
              <option value="ponderated">Ponderated</option>
              <option value="random">Random</option>
            </select>
            <NumberListInput v-if="$props.track.notesMode === 'manual'" v-model="$props.track.availableDegrees" />
            <NotesPresetSelector v-if="$props.track.notesMode === 'preset'" @preset-change="(presetId: string) => { $props.track.applyNotesPreset(presetId); }" />
            <span class="input-group-text">{{ notesIndicator }}</span>
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
            <input class="form-control choose-track-gravity-center" type="number" min="0" max="127" v-model="$props.track.gravityCenter" />
            <input class="form-control choose-track-gravity-strength" type="number" min="0" max="27" v-model="$props.track.gravityStrength" />
          </div>
        </div>
      </div>
    </div>
    <div class="col-12" v-if="computedView === 'expand'">
      <div class="row">
        <div class="col-12">
          <div class="edit-track-rythm input-group">
            <select class="input-group-text form-select" v-model="$props.track.rythmMode" @change="(ev: Event) => $props.track.applyRythmMode((ev.target as HTMLSelectElement).value as RythmMode)">
              <option value="manual">Manual</option>
              <option value="preset">Preset</option>
              <option value="16steps">16 steps</option>
              <option value="euclidean">Euclidean</option>
            </select>
            <NumberListInput class="w-50" v-if="$props.track.rythmMode === 'manual'" v-model="$props.track.rythmDefinition" />
            <RythmPresetSelector v-if="$props.track.rythmMode === 'preset'" @preset-change="(val) => { $props.track.applyRythmPreset(val); }" />
            <span class="input-group-text">Div.</span>
            <input class="form-control choose-track-division" type="number" min="0" v-model="$props.track.division" />
          </div>
        </div>
      </div>
      <div class="col-12" v-if="computedView === 'expand'">
        <StepsSequencer v-model="$props.track.rythmDefinition" />
      </div>
      <div class="col-12" v-if="computedView === 'expand'">
        <div class="input-group input-group">
          <span class="input-group-text" v-if="$props.track.rythmMode === 'euclidean'">Density</span>
          <input class="form-control" v-if="$props.track.rythmMode === 'euclidean'" type="number" min="0" max="64" v-model="$props.track.rythmDensity" />
          <span class="input-group-text">Proba.</span>
          <input class="form-control" type="number" min="0" max="100" v-model="$props.track.proba" />
          <span class="input-group-text">V.Ampl.</span>
          <input class="form-control" type="number" min="0" :max="100 - ($props.track.velCenter || 0)" v-model="$props.track.velAmplitude" />
          <span class="input-group-text">V.Center</span>
          <input class="form-control" type="number" :min="$props.track.velAmplitude || 0" :max="100 - ($props.track.velAmplitude || 0)" v-model="$props.track.velCenter" />
        </div>
      </div>
      <div class="col-12" v-if="computedView === 'expand'">
        <div class="row">
          <div class="col-2">
            <div class="input-group" role="group">
              <span class="input-group-text">Strum</span>
              <input class="form-control" type="number" min="0" v-model="$props.track.strumDelay" />
            </div>
          </div>
          <div class="col-2">
            <div class="input-group" role="group">
              <span class="input-group-text">Gate</span>
              <input class="form-control" type="number" min="0" max="100" v-model="$props.track.gate" />
            </div>
          </div>
          <div class="col-2">
            <div class="edit-track-notes input-group">
              <span class="input-group-text">Octaves</span>
              <NumberListInput v-model="$props.track.octaves" />
            </div>
          </div>
          <div class="col-2">
            <Slider />
          </div>
        </div>
      </div>
    </div>
    <div class="col-12" v-if="computedView === 'perf'">
      <div class="row">
        <div class="col-3">
          <div class="input-group" role="group">
            <span class="input-group-text">Gravity</span>
            <input class="form-control choose-track-gravity-center" type="number" min="0" max="127" v-model="$props.track.gravityCenter" />
            <input class="form-control choose-track-gravity-strength" type="number" min="0" max="27" v-model="$props.track.gravityStrength" />
          </div>
        </div>
        <div class="col-9">
          <div class="input-group input-group">
            <span class="input-group-text">Div.</span>
            <input class="form-control choose-track-division" type="number" min="0" v-model="$props.track.division" />
            <span class="input-group-text">Density</span>
          <input class="form-control" type="number" min="0" max="64" v-model="$props.track.rythmDensity" />
            <span class="input-group-text">Proba.</span>
          <input class="form-control" type="number" min="0" max="100" v-model="$props.track.proba" />
            <span class="input-group-text">V.Ampl.</span>
          <input class="form-control" type="number" min="0" max="100" v-model="$props.track.velAmplitude" />
            <span class="input-group-text">V.Center</span>
          <input class="form-control" type="number" :min="$props.track.velAmplitude || 0" :max="100 - ($props.track.velAmplitude || 0)" v-model="$props.track.velCenter" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
</style>
