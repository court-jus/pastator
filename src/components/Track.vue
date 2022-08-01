<script setup lang="ts">
import NumberListInput from "./NumberListInput.vue";
import type { Preset, SongData } from "@/model/types";
import { noteNumberToName } from "@/model/engine";
import type { TrackModel } from "@/model/TrackModel";
import PresetSelect from "./PresetSelect.vue";

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
  <tr v-if="computedView === 'row'">
    <td>
      <button @click="$props.track.playpause">
        {{ $props.track.position }}
        {{ $props.track.playing ? "stop" : "play" }}
      </button>
    </td>
    <td><input class="small" type="number" v-model="$props.track.channel" /></td>
    <td><input class="small" type="number" v-model="$props.track.division" /></td>
    <td><input class="small" type="number" v-model="$props.track.gravityCenter" /></td>
    <td><input class="small" type="number" v-model="$props.track.gravityStrength" /></td>
    <td>
      <NumberListInput v-model="$props.track.availableDegrees" />
      <br />
      <span>{{ [...new Set(availableNotes)].map((val: number) => noteNumberToName(val)).join(" ") }}</span>
    </td>
    <td>
      <select v-model="$props.track.playMode">
        <option value="nil">----</option>
        <option value="up">Up</option>
        <option value="dn">Down</option>
        <option value="updn">UpDown</option>
        <option value="random">Random</option>
        <option value="atonce">Chord</option>
        <option value="strum">Strum</option>
      </select>
    </td>
    <td>
      <select v-model="$props.track.relatedTo">
        <option value="nil">----</option>
        <option value="scale">Scale</option>
        <option value="chord">Chord</option>
        <option value="static">Static</option>
      </select>
    </td>
    <td>
      <NumberListInput v-model="$props.track.rythmDefinition" /><br />
      <div>
        D<input class="small" type="number" v-model="$props.track.rythmDensity" />
        P<input class="small" type="number" v-model="$props.track.proba" />
        A<input class="small" type="number" v-model="$props.track.velAmplitude" />
        C<input class="small" type="number" v-model="$props.track.velCenter" />
      </div>
    </td>
    <td>
    </td>
    <td><input class="small" type="number" v-model="$props.track.baseVelocity" /></td>
    <td colspan="2">
      <PresetSelect :data="presets" :selectedCategory="$props.track.presetCategory"
        :selectedPreset="$props.track.presetId" @preset-change="(newPreset) => { $props.track.presetChange(newPreset); }" />
    </td>
    <td>
      <button @click="removeTrack">&times;</button>
      <button @click="() => { localViewType = 'expand' }">v</button>
    </td>
  </tr>
  <tr>
    <td colspan="50">
    <div>
      <button @click="$props.track.playpause">
        {{ $props.track.playing ? "stop" : "play" }}
      </button>
      C: <input class="small" type="number" v-model="$props.track.gravityCenter" />
      S: <input class="small" type="number" v-model="$props.track.gravityStrength" />
      D: <input class="small" type="number" v-model="$props.track.rythmDensity" />
      P: <input class="small" type="number" v-model="$props.track.proba" />
      A: <input class="small" type="number" v-model="$props.track.velAmplitude" />
      C: <input class="small" type="number" v-model="$props.track.velCenter" />
      <button @click="() => { localViewType = '' }">^</button>
    </div>
    </td>
  </tr>
</template>


<style scoped>
.small {
  width: 46px;
}

tr {
  vertical-align: top;
}
</style>
