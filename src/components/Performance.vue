<script setup lang="ts">
interface Props {
  clock: number
  device: MIDIOutput
  ccDevice?: MIDIInput
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import { TrackModel } from "@/model/TrackModel";
import TrackList from "./TrackList.vue";
import type { SongData, SavedSongModel } from "@/model/types";
import { noteNumberToName, isMIDIMessageEvent, getMIDIMessage } from "@/model/engine";
import { scales, chords } from "@/model/presets";
import { download } from "@/utils";

interface Data {
  tracks: TrackModel[]
  songData: SongData
  fileName: string
  position: number
  playing: boolean
  barLength: number
}

export default defineComponent({
  data(): Data {
    return {
      tracks: [] as TrackModel[],
      fileName: "",
      songData: {
        chordProgression: [1, 1, 4, 4, 6, 5],
        rootNote: 60,
        scale: "major",
        currentChord: 1,
        currentChordType: "triad"
      },
      position: 0,
      playing: false,
      barLength: 96
    }
  },
  computed: {
    chordProgressionComputed: {
      get() {
        return this.songData.chordProgression.join(" ");
      },
      set(newValue: string) {
        this.songData.chordProgression = newValue.split(" ").map((val: string) => parseInt(val, 10));
      }
    },
    relativeZero: function () {
      return Math.trunc(this.$props.clock / this.barLength - this.position) * this.barLength;
    }
  },
  watch: {
    clock(newClock, oldClock) {
      if (newClock % this.barLength === 0) {
        this.position += 1;
        if (this.playing) {
          this.songData.currentChord = this.songData.chordProgression[this.position % this.songData.chordProgression.length];
        }
      }
    },
    ccDevice(newDevice: MIDIInput, oldDevice: MIDIInput | undefined) {
      if (oldDevice !== undefined) {
        oldDevice.onmidimessage = null;
        oldDevice.close();
      }
      newDevice.onmidimessage = (message) => {
        if (isMIDIMessageEvent(message)) {
          const m = getMIDIMessage(message);
          if (m.type === "Control Change") {
            const [ , cc, val] = Array.from(m.data);
            for (let trackIndex = 0; trackIndex < this.tracks.length; trackIndex++) {
              if (trackIndex === m.channel as number - 1) {
                this.tracks[trackIndex].receiveCC(cc, val);
              }
            }
          }
        }
      }
    }
  },
  methods: {
    addTrack(track?: TrackModel) {
      this.tracks.push(track ? track : new TrackModel(this.$props.device));
    },
    removeTrack(index: number) {
      this.tracks.splice(index, 1);
    },
    playpause(all = true) {
      this.playing = !this.playing;
      if (all) {
        for(const track of this.tracks) {
          if (this.playing) {
            track.play();
          } else {
            track.fullStop();
          }
        }
      }
    },
    stop(all = true) {
      this.playing = false;
      if (all) {
        for(const track of this.tracks) {
          track.fullStop();
        }
      }
      this.rewind();
    },
    rewind() {
      this.position = 0;
      if (this.playing) {
        this.songData.currentChord = this.songData.chordProgression[this.position % this.songData.chordProgression.length];
      }
    },
    panic() {
      this.stop();
      for(const track of this.tracks) {
        track.fullStop(true);
      }
    },
    loadFile(evt: Event) {
      this.tracks = [];
      const files = (evt.target as HTMLInputElement).files;
      if (files === null) return;
      const f = files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        if (typeof reader.result === "string") {
          this.fileName = f.name;
          const loadedSongData = JSON.parse(reader.result) as SavedSongModel;
          console.log("loadFile", loadedSongData);
          this.songData.rootNote = loadedSongData.rootNote;
          this.songData.scale = loadedSongData.scale;
          this.songData.currentChord = loadedSongData.currentChord;
          this.songData.currentChordType = loadedSongData.currentChordType;
          this.songData.chordProgression = loadedSongData.chordProgression;
          for (const trackData of loadedSongData.tracks) {
            const newTrack = new TrackModel(this.$props.device);
            newTrack.load(trackData);
            this.addTrack(newTrack);
          }
        }
      });
      reader.readAsText(f);
    },
    newProject() {
      this.tracks = [];
    },
    saveFile() {
      const dataToSave: SavedSongModel = {
        ...this.songData,
        tracks: this.tracks.map(track => track.save())
      }
      const json = JSON.stringify(dataToSave, undefined, 2);
      const filename = this.fileName ? (
        this.fileName.toLowerCase().endsWith(".json") ? this.fileName : this.fileName + ".json"
      ) : "pastasong.json";
      download(filename, json);
      console.log("Data to save", dataToSave);
    }
  }
});
</script>

<template>
  <div class="row">
    <div>
      <button @click="() => { playpause(true); }">{{ playing ? "Pause" : "Play" }}</button>
      <button @click="() => { stop(true); } ">Stop</button>
      <button @click="rewind">Rew</button>
      <button @click="panic">Panic</button>
    </div>
    <div>
      <input type="number" v-model="songData.rootNote" />
      <br />
      <span>{{ clock }} {{ position }} {{ relativeZero }}</span>
    </div>
    <div>
      <select v-model="songData.scale">
        <option>major</option>
        <option>minor</option>
      </select>
      <br />
      {{ scales[songData.scale].map((val: number) => noteNumberToName(val, false)).join(" ") }}
    </div>
    <div>
      <input v-model.lazy="chordProgressionComputed" />
      <br />
      <input type="number" min="1" max="7" v-model="songData.currentChord" />
      <br />
      <button v-for="chordDegree of [1, 2, 3, 4, 5, 6, 7]" @click="songData.currentChord = chordDegree"
        :class="songData.currentChord === chordDegree ? 'active' : ''">
        {{ chordDegree }}
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
      <br />
      {{ chords[songData.currentChordType].join(" ") }}
    </div>
  </div>
  <h2>Tracks</h2>
  <table>
    <TrackList :tracks="tracks" :device="device" :song-data="songData" :clock="clock" :clock-start="relativeZero" :removeTrack="removeTrack" />
    <tfoot>
      <tr>
        <th colspan="2">
          <button @click="() => addTrack()">Add track</button>
        </th>
        <th colspan="8">
          <div style="display: flex; align-items: center; justify-content: space-around;">
            <button @click="newProject">New project</button>
            <form enctype="multipart/form-data" style="display: flex; align-items: center">
              <label>
                Load project
                <input type="file" accept="application/json" name="song" @change="loadFile" />
              </label>
            </form>
          </div>
        </th>
        <th colspan="3">
          <button @click="saveFile">Save project</button>
          <input type="text" v-model="fileName" placeholder="Choose filename" />
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
  background-color: aliceblue;
  border: 1px solid darkslategray;
  cursor: pointer;
}

.active {
  background-color: darkslategray;
  color: aliceblue;
}
</style>
