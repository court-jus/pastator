<script setup lang="ts">
import NumberListInput from "./NumberListInput.vue";
import type { EuclideanMode, Preset, SongData } from "@/model/types";
import { noteNumberToName } from "@/model/engine";
import { scales } from "@/model/presets";
import type { TrackModel, RythmMode, NotesMode } from "@/model/TrackModel";
import PresetSelect from "./PresetSelect.vue";
import ConfirmButton from "./ConfirmButton.vue";
import EuclideanView from "./EuclideanView.vue";
import StepsSequencer from "./StepsSequencer.vue";
import RythmPresetSelector from "./RythmPresetSelector.vue";
import NotesPresetSelector from "./NotesPresetSelector.vue";
import ChannelSelector from "./ChannelSelector.vue";
import StrumSelector from "./StrumSelector.vue";
import DivisionSelector from "./DivisionSelector.vue";
import MelotorEdit from "./MelotorEdit.vue";

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
      return this.$props.track.getAvailableNotes(this.songData);
    },
    computedView: function() {
      return this.localViewType ? this.localViewType : this.$props.viewType;
    },
    notesIndicator: function() {
      const availableNotesNames = [...new Set(this.availableNotes)].map((val: number) => noteNumberToName(val, this.songData));
      const [lowLimit, highLimit] = this.$props.track.getNotesLimits().map((val: number) => noteNumberToName(val, this.songData));
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
    clock(newClock: number, oldClock: number) {
      this.$props.track.tick(newClock, oldClock, this.$props.songData);
    },
    'songData.currentChord'() {
      this.$props.track.currentChordChange(this.$props.songData, this.$props.clock);
    },
    'songData.currentChordType'() {
      this.$props.track.currentChordChange(this.$props.songData, this.$props.clock);
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
            <button @click="() => track.playpause($props.songData, $props.clock)" class="btn btn-outline-primary playpause-track" title="Play/Pause track">
              <i :class="'bi bi-' + (track.playing ? 'pause' : 'play') + '-fill'"></i>
            </button>
            <ConfirmButton label="Remove track" @confirmed="removeTrack">
              <i class="bi bi-trash-fill"></i>
            </ConfirmButton>
            <button class="btn btn-outline-primary change-track-view" @click="cycleView">
              <i class="bi bi-eye-fill"></i>
            </button>
            <button class="btn btn-outline-primary" @click="track.addSingleShot">
              <i class="bi bi-eye-fill" v-if="track.singleShots === undefined"></i>
              <span v-else>{{ track.singleShots }}</span>
            </button>
          </div>
        </div>
        <div class="col-4">
          <div class="input-group" role="group">
            <span class="input-group-text">Channel</span>
            <ChannelSelector :selected-channel="track.channel" @channel-change="(ch) => { track.setChannel(ch); }" />
            <span class="input-group-text">Vol.</span>
            <input class="form-control choose-track-base-velocity" type="number" min="0" max="100" v-model="track.baseVelocity" />
          </div>
        </div>
        <div class="col-6">
          <div class="choose-track-preset">
            <PresetSelect :data="presets" :selectedCategory="track.presetCategory"
              :selectedPreset="track.presetId" @preset-change="(newPreset) => { track.presetChange(newPreset); }" />
          </div>
        </div>
      </div>
    </div>
    <div class="col-12" v-if="computedView === 'expand'">
      <div class="row">
        <div :class="track.notesMode === 'melotor' ? 'col-9' : 'col-6'">
          <div class="edit-track-notes input-group">
            <select class="input-group-text form-select" v-model="track.notesMode" @change="(ev: Event) => track.applyNotesMode((ev.target as HTMLSelectElement).value as NotesMode, songData)">
              <option value="manual">Manual</option>
              <option value="preset">Preset</option>
              <option value="ponderated">Ponderated</option>
              <option value="melotor">Melotor</option>
              <option value="random">Random</option>
            </select>
            <NumberListInput v-if="track.notesMode === 'manual'" v-model="track.availableDegrees" />
            <NumberListInput v-if="track.notesMode === 'melotor' && track.melotor" v-model="track.melotor.currentMelo" />
            <NotesPresetSelector v-if="track.notesMode === 'preset'" @preset-change="(presetId: string) => { track.applyNotesPreset(presetId); }" />
            <span class="input-group-text">{{ notesIndicator }}</span>
          </div>
        </div>
        <div class="col-3" v-if="track.notesMode !== 'melotor'">
          <div class="input-group" role="group">
            <select class="form-select choose-track-play-mode" v-model="track.playMode">
              <option value="nil">----</option>
              <option value="up">Up</option>
              <option value="dn">Down</option>
              <option value="updn">UpDown</option>
              <option value="random">Random</option>
              <option value="atonce">Chord</option>
              <option value="strum">Strum</option>
            </select>
            <select class="form-select choose-track-related-to" v-model="track.relatedTo">
              <option value="nil">----</option>
              <option value="scale">Scale</option>
              <option value="chord">Chord</option>
              <option value="invchord">Chord (Inv.)</option>
              <option value="static">Static</option>
            </select>
          </div>
        </div>
        <div class="col-3">
          <div class="input-group" role="group">
            <span class="input-group-text">Gravity</span>
            <input class="form-control choose-track-gravity-center" type="number" min="1" max="127" v-model="track.gravityCenter" />
            <input class="form-control choose-track-gravity-strength" type="number" min="1" max="27" v-model="track.gravityStrength" />
          </div>
        </div>
      </div>
    </div>
    <div class="col-12" v-if="computedView !== 'reduced' && track.notesMode === 'melotor' && track.melotor?.notesProbabilities !== undefined">
      <div class="row mt-1 mb-1">
        <MelotorEdit :melotor="track.melotor" :song-data="songData" />
      </div>
    </div>
    <div class="col-12" v-if="computedView === 'expand'">
      <div class="row">
        <div class="col-12">
          <div class="edit-track-rythm input-group">
            <select class="input-group-text form-select" v-model="track.rythmMode" @change="(ev: Event) => track.applyRythmMode((ev.target as HTMLSelectElement).value as RythmMode)">
              <option value="manual">Manual</option>
              <option value="preset">Preset</option>
              <option value="16steps">16 steps</option>
              <option value="euclidean">Euclidean</option>
              <option value="durations">Durations</option>
            </select>
            <NumberListInput class="w-50" v-if="track.rythmMode === 'manual' || track.rythmMode === 'durations'" v-model="track.rythmDefinition" />
            <RythmPresetSelector v-if="track.rythmMode === 'preset'" @preset-change="(val) => { track.applyRythmPreset(val); }" />
            <select v-if="track.rythmMode === 'euclidean'"
                    class="form-select"
                    :value="track.euclideanMode"
                    @change="(ev) => {
                      track.setEuclideanSettings({mode: ((ev.target as HTMLSelectElement).value as EuclideanMode)});
                    }">
              <option value="linear">Lin.</option>
              <option value="sinus">Sin.</option>
              <option value="dexp">Exp. D</option>
              <option value="uexp">Exp. U</option>
            </select>
            <DivisionSelector :selected="track.division" @value-change="(newVal) => { track.division = newVal; }" />
          </div>
        </div>
      </div>
      <div class="col-12" v-if="computedView === 'expand'">
        <StepsSequencer v-if="track.rythmMode !== 'durations'" v-model="track.rythmDefinition" :position="track.rythmPosition" />
      </div>
      <div class="col-12" v-if="track.rythmMode === 'euclidean' && track.rythmDensity !== undefined">
        <EuclideanView :density="track.rythmDensity" :mode="track.euclideanMode || 'linear'" />
      </div>
      <div class="col-12" v-if="computedView === 'expand'">
        <div class="input-group input-group">
          <span class="input-group-text" v-if="track.rythmMode === 'euclidean'">Density</span>
          <input class="form-control"
                 v-if="track.rythmMode === 'euclidean'"
                 type="number"
                 min="0"
                 max="64"
                 :value="track.rythmDensity"
                 @change="(ev) => {
                  if (!ev.target) return;
                  track.setEuclideanSettings({density: parseInt((ev.target as HTMLInputElement).value, 10)});
                 }"
                 />
          <span class="input-group-text">Proba.</span>
          <input class="form-control" type="number" min="0" max="100" v-model="track.proba" />
          <span class="input-group-text">V.Ampl.</span>
          <input class="form-control" type="number" min="0" :max="100 - (track.velCenter || 0)" v-model="track.velAmplitude" />
          <span class="input-group-text">V.Center</span>
          <input class="form-control" type="number" :min="track.velAmplitude || 0" :max="100 - (track.velAmplitude || 0)" v-model="track.velCenter" />
        </div>
      </div>
      <div class="col-12" v-if="computedView === 'expand'">
        <div class="row">
          <div class="col-2">
            <div class="input-group" role="group">
              <span class="input-group-text">Strum</span>
              <StrumSelector :selected="track.strumDelay" @change="(val) => track.strumDelay = val" />
            </div>
          </div>
          <div class="col-2">
            <div class="input-group" role="group">
              <span class="input-group-text">Gate</span>
              <input class="form-control" type="number" min="0" max="100" v-model="track.gate" />
            </div>
          </div>
          <div class="col-2">
            <div class="edit-track-notes input-group">
              <span class="input-group-text">Octaves</span>
              <NumberListInput v-model="track.octaves" />
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
            <input class="form-control choose-track-gravity-center" type="number" min="1" max="127" v-model="track.gravityCenter" />
            <input class="form-control choose-track-gravity-strength" type="number" min="1" max="27" v-model="track.gravityStrength" />
          </div>
        </div>
        <div class="col-9">
          <div class="input-group input-group">
            <span class="input-group-text">Div.</span>
            <input class="form-control choose-track-division" type="number" min="0" v-model="track.division" />
            <span class="input-group-text">Density</span>
          <input class="form-control" type="number" min="0" max="64" v-model="track.rythmDensity" />
            <span class="input-group-text">Proba.</span>
          <input class="form-control" type="number" min="0" max="100" v-model="track.proba" />
            <span class="input-group-text">V.Ampl.</span>
          <input class="form-control" type="number" min="0" max="100" v-model="track.velAmplitude" />
            <span class="input-group-text">V.Center</span>
          <input class="form-control" type="number" :min="track.velAmplitude || 0" :max="100 - (track.velAmplitude || 0)" v-model="track.velCenter" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
</style>
