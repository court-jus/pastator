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
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import { presets } from "@/model/presets";

export default defineComponent({
  data() {
    return {
      lastNotes: [] as number[],
      preset: undefined as Preset | undefined
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
        if (pcLow < this.$props.track.gate && pcHigh >= this.$props.track.gate) {
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
  <tr>
    <td>
      <button @click="$props.track.playpause">
        {{ $props.track.position }}
        {{ $props.track.playing ? "stop" : "play" }}
      </button>
    </td>
    <td>
      <input class="small" type="number" v-model="$props.track.channel" /><br />
      {{ $props.track.device?.name }}
    </td>
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
      <NumberListInput v-model="$props.track.rythmDefinition" />
    </td>
    <td><input class="small" type="number" v-model="$props.track.baseVelocity" /></td>
    <td colspan="2">
      <PresetSelect :data="presets" :selectedCategory="$props.track.presetCategory"
        :selectedPreset="$props.track.presetId" @preset-change="$props.track.presetChange" />
    </td>
    <td>
      <button @click="removeTrack">&times;</button>
    </td>
  </tr>
</template>


<style scoped>
.small {
  width: 60px;
}

tr {
  vertical-align: top;
}
</style>
