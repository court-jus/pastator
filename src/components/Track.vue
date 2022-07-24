<script setup lang="ts">
import type { TrackModel } from "../model/TrackModel";
import type { Preset, SongData } from "./types";
import NumberListInput from "./NumberListInput.vue";
import { getNotes, noteNumberToName, playNote, stopNote } from "../model/engine";
import PresetSelect from "./PresetSelect.vue";

interface Props {
  track: TrackModel
  songData: SongData
  device: MIDIOutput
  clock: number
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import { presets } from "@/model/presets";

export default defineComponent({
  data() {
    return {
      channel: 0,
      division: 48,
      gate: 100,
      position: 0,
      gravityCenter: undefined,
      gravityStrength: undefined,
      availableDegrees: [0, 1, 2],
      octaves: [0],
      playMode: "random",
      relatedTo: "chord",
      rythmDefinition: [100],
      baseVelocity: 100,
      playing: false,
      currentNotes: [] as number[],
      transpose: 0,
      lastNotes: [] as number[],
      preset: undefined as Preset | undefined
    }
  },
  computed: {
    availableNotes: function () {
      const candidateNotes = getNotes(this.$props.songData, this.availableDegrees, this.octaves, this.relatedTo);
      if (this.gravityCenter === undefined || this.gravityStrength === undefined) {
        return candidateNotes;
      }
      const margin = Math.trunc((140 - this.gravityStrength) / 2);
      const lowerBound = Math.max(this.gravityCenter - margin, 0);
      const higherBound = Math.min(this.gravityCenter + margin, 127);
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
        return this.rythmDefinition.join(" ");
      },
      set(newValue: string) {
        this.rythmDefinition = newValue.split(" ").map((val: string) => parseInt(val, 10));
      }
    }
  },
  watch: {
    clock(newClock: number) {
      if (!this.playing || this.division === 0) return;
      if (newClock % this.division === 0) {
        if (this.gate === 100) this.stop();
        this.play();
      } else if (this.gate < 100) {
        const pcLow = ((newClock % this.division) / this.division) * 100;
        const pcHigh = (((newClock + 1) % this.division) / this.division) * 100;
        if (pcLow < this.gate && pcHigh >= this.gate) {
          this.stop();
        }
      }
    },
    channel(newChannel: number, oldChannel: number) {
      this.stop();
    },
    'songData.currentChord'(newChord: number) {
      if (!this.playing) return;
      this.stop();
      this.play();
    },
    'songData.currentChordType'(newChord: number) {
      if (!this.playing) return;
      this.stop();
      this.play();
    }
  },
  methods: {
    play() {
      if (this.device === null) return;
      const reversed = [...this.availableNotes].reverse();
      const upDn = this.availableNotes.concat(reversed);
      const playedNotes = (
        (this.playMode === "atonce" || this.playMode === "strum") ?
        this.availableNotes :
        this.playMode === "random" ?
        [this.availableNotes[Math.floor(Math.random() * this.availableNotes.length)]] :
        this.playMode === "up" ?
        [this.availableNotes[this.position % this.availableNotes.length]] :
        this.playMode === "dn" ?
        [this.availableNotes[this.availableNotes.length - 1 - (this.position % this.availableNotes.length)]] :
        this.playMode === "updn" ?
        [upDn[this.position % upDn.length]] :
        [this.availableNotes[0]]
      );
      const velocity = this.rythm();
      if (velocity > 0) {
        let strumDelay = 0;
        for (const note of playedNotes) {
          this.currentNotes.push(note + this.transpose);
          playNote(this.device, this.channel, note + this.transpose, velocity, strumDelay);
          strumDelay += this.playMode === "strum" ? 150 : 0;
        }
      }
      this.position += 1;
    },
    stop() {
      if (this.device === null) return;
      if (this.currentNotes.length === 0) return;
      for (const currentNote of this.currentNotes) {
        stopNote(this.device, this.channel, currentNote);
      }
      this.currentNotes = [];
    },
    fullStop(panic = false) {
      if (panic) this.stop();
      this.playing = false;
      this.position = 0;
    },
    toggleStop() {
      if (this.playing) {
        this.fullStop(true);
      } else {
        this.playing = true;
      }
    },
    rythm() {
      const chosenVelocity = this.rythmDefinition[this.position % this.rythmDefinition.length];
      const restThreshold = 100;
      if (chosenVelocity >= restThreshold) {
        return (chosenVelocity * this.baseVelocity) / 100;
      }
      const restProbability = chosenVelocity / restThreshold;
      if (Math.random() >= restProbability) return 0;
      return (chosenVelocity * this.baseVelocity) / 100;
    },
    presetChange(newPreset: Preset) {
      console.log("presetChange", newPreset);
      this.preset = newPreset;
      this.rythmDefinition = newPreset.rythm;
      this.octaves = newPreset.octaves;
      this.availableDegrees = newPreset.notes;
      this.division = newPreset.division;
      this.playMode = newPreset.playMode;
      this.relatedTo = newPreset.relatedTo;
    }
  }
});
</script>

<template>
  <tr>
    <td>
      <button @click="toggleStop">
        {{ playing ? position : "S" }}
      </button>
    </td>
    <td><input class="small" type="number" v-model="channel" /></td>
    <td><input class="small" type="number" v-model="division" /></td>
    <td><input class="small" type="number" v-model="gravityCenter" /></td>
    <td><input class="small" type="number" v-model="gravityStrength" /></td>
    <td>
      <NumberListInput v-model="availableDegrees" />
      <br />
      <span>{{ [...new Set(availableNotes)].map((val: number) => noteNumberToName(val)).join(" ") }}</span>
    </td>
    <td>
      <select v-model="playMode">
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
      <select v-model="relatedTo">
        <option value="nil">----</option>
        <option value="scale">Scale</option>
        <option value="chord">Chord</option>
        <option value="static">Static</option>
      </select>
    </td>
    <td>
      <NumberListInput v-model="rythmDefinition" />
    </td>
    <td><input class="small" type="number" v-model="baseVelocity" /></td>
    <td colspan="2">
      <PresetSelect :data="presets" @presetChange="presetChange"/>
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
