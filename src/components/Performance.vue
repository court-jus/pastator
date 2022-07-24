<script setup lang="ts">
interface Props {
  clock: number
  device: MIDIOutput
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import { TrackModel } from "@/model/TrackModel";
import TrackList from "./TrackList.vue";
import type { SongData } from "./types";
import { noteNumberToName } from "../model/engine";
import { scales, chords } from "../model/presets";

interface Data {
  tracks: TrackModel[]
  chordProgression: number[]
  songData: SongData
}

export default defineComponent({
  data() {
    return {
      tracks: [] as TrackModel[],
      chordProgression: [1, 1, 4, 4, 6, 5],
      songData: {
        rootNote: 60,
        scale: "major",
        currentChord: 1,
        currentChordType: "triad"
      }
    } as Data
  },
  computed: {
    chordProgressionComputed: {
      get() {
        return this.chordProgression.join(" ");
      },
      set(newValue: string) {
        this.chordProgression = newValue.split(" ").map((val: string) => parseInt(val, 10));
      }
    }
  },
  methods: {
    addTrack() {
      this.tracks.push(new TrackModel(this.tracks.length));
    }
  }
});
</script>

<template>
  <div class="row">
    <div>
      <input type="number" v-model="songData.rootNote" />
      <br />
      <span>{{ clock }}</span>
    </div>
    <div>
      <select v-model="songData.scale">
        <option>major</option>
        <option>minor</option>
      </select>
      <br/>
      {{scales[songData.scale].map((val: number) => noteNumberToName(val, false)).join(" ")}}
    </div>
    <div>
      <input v-model.lazy="chordProgressionComputed" />
      <br />
      <input type="number" min="1" max="7" v-model="songData.currentChord" />
      <br />
      <button
        v-for="chordDegree of [1, 2, 3, 4, 5, 6, 7]"
        @click="songData.currentChord = chordDegree"
        :class="songData.currentChord === chordDegree ? 'active': ''">
        {{chordDegree}}
      </button>
    </div>
    <div>
      <select v-model="songData.currentChordType">
        <option>triad</option>
        <option>power</option>
        <option>sus2</option>
        <option>sus4</option>
        <option>sixth</option>
        <option>seventh</option>
        <option>ninth</option>
        <option>eleventh</option>
      </select>
      <br/>
      {{chords[songData.currentChordType].join(" ")}}
    </div>
  </div>
  <h2>Tracks</h2>
  <table>
    <TrackList :tracks="tracks" :device="device" :song-data="songData" :clock="clock" />
    <tfoot>
      <tr>
        <th colspan="2">
          <button @click="addTrack">Add track</button>
        </th>
        <th colspan="8">
          <div style="display: flex; align-items: center; justify-content: space-around;">
            <button id="newsong-btn">New project</button>
            <form enctype="multipart/form-data" style="display: flex; align-items: center">
              <label for="song-file-input">Load project</label>
              <input id="song-file-input" type="file" accept="application/json" name="song" />
            </form>
          </div>
        </th>
        <th colspan="3">
          <button id="savesong-btn">Save project</button>
        </th>
      </tr>
    </tfoot>
  </table>
</template>


<style scoped>
.row {
  display: flex;
  flex-direction: row;
  align-items: start;
}

button {
  border: none;
  padding: 1px 6px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 1em;
  border-radius: 5px;
  color: darkslategray;
  background-color:aliceblue;
  border: 1px solid darkslategray;
  cursor: pointer;
}
.active {
  background-color: darkslategray;
  color:aliceblue;
}
</style>
