<script setup lang="ts">
import type { Preset, SongData } from "./types";
import NumberListInput from "./NumberListInput.vue";
import { getNotes, noteNumberToName, playNote, stopNote } from "../model/engine";
import type { TrackModel } from "../model/TrackModel";
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
      position: 0,
      playing: false,
      currentNotes: [] as number[],
      lastNotes: [] as number[],
      preset: undefined as Preset | undefined
    }
  },
  computed: {
    availableNotes: function () {
      const candidateNotes = getNotes(this.$props.songData, this.$props.track.availableDegrees, this.$props.track.octaves, this.$props.track.relatedTo);
      if (this.$props.track.gravityCenter === undefined || this.$props.track.gravityStrength === undefined) {
        return candidateNotes;
      }
      const margin = Math.trunc((140 - this.$props.track.gravityStrength) / 2);
      const lowerBound = Math.max(this.$props.track.gravityCenter - margin, 0);
      const higherBound = Math.min(this.$props.track.gravityCenter + margin, 127);
      return candidateNotes.map((note) => {
        if (note < lowerBound) {
          const transp = lowerBound - note;
          return note + transp + (12 - (transp % 12));
        }
        if (note > higherBound) {
          const transp = note - higherBound;
          return note - transp - (12 - (transp % 12));
        }
        return note;
      });
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
    clock(newClock: number) {
      if (this.$props.track.division === 0) return;
      this.position = Math.trunc(newClock / this.$props.track.division);
      if (!this.playing) return;
      if (newClock % this.$props.track.division === 0) {
        if (this.$props.track.gate === 100) this.stop();
        this.play();
      } else if (this.$props.track.gate < 100) {
        const pcLow = ((newClock % this.$props.track.division) / this.$props.track.division) * 100;
        const pcHigh = (((newClock + 1) % this.$props.track.division) / this.$props.track.division) * 100;
        if (pcLow < this.$props.track.gate && pcHigh >= this.$props.track.gate) {
          this.stop();
        }
      }
    },
    'track.channel'(newChannel: number, oldChannel: number) {
      this.stop();
    },
    'songData.currentChord'(newChord: number) {
      if (!this.playing) return;
      if (this.$props.track.division === 0) {
        this.stop();
        this.play();
      }
    },
    'songData.currentChordType'(newChord: number) {
      if (!this.playing) return;
      if (this.$props.track.division === 0) {
        this.stop();
        this.play();
      }
    }
  },
  methods: {
    play() {
      if (this.device === null) return;
      const reversed = [...this.availableNotes].reverse();
      const upDn = this.availableNotes.concat(reversed);
      const playedNotes = (
        (this.$props.track.playMode === "atonce" || this.$props.track.playMode === "strum") ?
          this.availableNotes :
          this.$props.track.playMode === "random" ?
            [this.availableNotes[Math.floor(Math.random() * this.availableNotes.length)]] :
            this.$props.track.playMode === "up" ?
              [this.availableNotes[this.position % this.availableNotes.length]] :
              this.$props.track.playMode === "dn" ?
                [this.availableNotes[this.availableNotes.length - 1 - (this.position % this.availableNotes.length)]] :
                this.$props.track.playMode === "updn" ?
                  [upDn[this.position % upDn.length]] :
                  [this.availableNotes[0]]
      );
      const velocity = this.rythm();
      if (velocity > 0 && this.$props.track.channel !== undefined) {
        let strumDelay = 0;
        for (const note of playedNotes) {
          this.currentNotes.push(note + this.$props.track.transpose);
          playNote(this.device, this.$props.track.channel, note + this.$props.track.transpose, velocity, strumDelay);
          strumDelay += this.$props.track.playMode === "strum" ? 150 : 0;
        }
      }
    },
    stop() {
      if (this.device === null) return;
      if (this.currentNotes.length === 0) return;
      if (this.$props.track.channel === undefined) return;
      for (const currentNote of this.currentNotes) {
        stopNote(this.device, this.$props.track.channel, currentNote);
      }
      this.currentNotes = [];
    },
    fullStop(panic = false) {
      if (panic) this.stop();
      this.playing = false;
    },
    toggleStop() {
      if (this.playing) {
        this.fullStop(true);
      } else {
        this.playing = true;
      }
    },
    rythm() {
      const chosenVelocity = this.$props.track.rythmDefinition[this.position % this.$props.track.rythmDefinition.length];
      const restThreshold = 100;
      if (chosenVelocity >= restThreshold) {
        return (chosenVelocity * this.$props.track.baseVelocity) / 100;
      }
      const restProbability = chosenVelocity / restThreshold;
      if (Math.random() >= restProbability) return 0;
      return (chosenVelocity * this.$props.track.baseVelocity) / 100;
    },
    presetChange(newPreset: Preset) {
      console.log("presetChange", newPreset);
      this.preset = newPreset;
      this.$props.track.rythmDefinition = newPreset.rythm;
      this.$props.track.octaves = newPreset.octaves;
      this.$props.track.availableDegrees = newPreset.notes;
      this.$props.track.division = newPreset.division;
      this.$props.track.playMode = newPreset.playMode;
      this.$props.track.relatedTo = newPreset.relatedTo;
    }
  },
  beforeUnmount() {
    this.fullStop(true);
  }
});
</script>

<template>
  <tr>
    <td>
      <button @click="toggleStop">
        {{ position }}
        {{ playing ? "stop" : "play" }}
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
      <NumberListInput v-model="$props.track.rythmDefinition" />
    </td>
    <td><input class="small" type="number" v-model="$props.track.baseVelocity" /></td>
    <td colspan="2">
      <PresetSelect :data="presets" :selectedCategory="$props.track.presetCategory"
        :selectedPreset="$props.track.presetId" @preset-change="presetChange" />
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
