<script setup lang="ts">
interface Props {
  song: SongModel;
  addTrack: (track?: TrackModel) => void;
  panic: () => void;
  playpause: (a: boolean, b: boolean) => void;
  rewind: () => void;
  newProject: () => void;
  saveFile: (fileName: string) => void;
  removeTrack: (trackId: string) => void;
  loadFile: (evt: Event) => void;
}
defineProps<Props>();
</script>

<script lang="ts">
import { defineComponent } from "vue";
import { TrackModel } from "@/model/TrackModel";
import TrackList from "./TrackList.vue";
import type { ChordType, Scale, Tour } from "@/model/types";
import { noteNumberToName } from "@/model/engine";
import { scales, chords, BarLength } from "@/model/presets";
import ConfirmButton from "./ConfirmButton.vue";
import { SongModel } from "@/model/SongModel";

type ViewType = "expand" | "reduced" | "perf";

interface Data {
  fileName: string;
  position: number;
  barLength: number;
  tour: Tour;
  trackTour: Tour;
  viewType: ViewType;
}

export default defineComponent({
  data(): Data {
    return {
      viewType: "expand",
      fileName: "",
      position: 0,
      barLength: BarLength,
      tour: {
        steps: [
          {
            target: "#performance-zone",
            content:
              "This is the main performance control zone. It allows you to define the global parameters of your performance such as key, chord progression and to control them while playing.",
          },
          {
            target: "#transport-buttons",
            content:
              "The transport buttons allow to control all tracks at once (play, stop, rew) and to send NoteOff messages to your synth (panic).",
          },
          {
            target: "#key-parameters",
            content:
              "Here you can define the root note and scale type or mode you want to use.",
          },
          {
            target: "#chords-control",
            content:
              "Here you can configure the chord progression or manually trigger chords using the dedicated buttons.",
          },
          {
            target: "#chord-progression",
            content:
              "You'll see more fields like this one later, they expect you to input numbers separated by spaces.",
          },
          {
            target: "#chord-type",
            content:
              "Finally you can choose here the chord type or flavor you want.",
          },
          {
            target: "#add-track",
            content:
              "Now, click Finish to close this tour then click the Add track button to start creating a new song",
          },
        ],
        callbacks: {
          onFinish: () => {
            localStorage.setItem("skipPerfTour", "true");
          },
          onSkip: () => {
            localStorage.setItem("skipPerfTour", "true");
          },
          onStop: () => {
            localStorage.setItem("skipPerfTour", "true");
          },
        },
      },
      trackTour: {
        steps: [
          {
            target: "#track-list div.row:first-child",
            content:
              "You'll have one row per track. You can create as many tracks as you want, even multiple tracks playing the same instrument.",
          },
          {
            target: "#track-list div.row:first-child .playpause-track",
            content: "Play or stop this track.",
          },
          {
            target: "#track-list div.row:first-child .choose-track-channel",
            content: "Select the MIDI channel this track will be driving.",
          },
          {
            target: "#track-list div.row:first-child .choose-track-division",
            content: "Select the division for this track. One bar is 96.",
          },
          {
            target:
              "#track-list div.row:first-child .choose-track-gravity-center",
            content:
              "Here you can define the gravity center, gravity will pull notes toward this center while staying in the key or chord as chosen.",
          },
          {
            target:
              "#track-list div.row:first-child .choose-track-gravity-strength",
            content:
              "The gravity strength define how hard the notes are pulled toward the center.",
          },
          {
            target: "#track-list div.row:first-child .edit-track-notes",
            content:
              "Enter notes (or degrees) for this instrument. Notes can be relative to the scale or the chord, this will be defined next. If you choose the notes 1 and 3 in the scale of C major, you'll have C and E. However, in the first triad chord of C major, you'll get C and G (G being the third note in the chord).",
          },
          {
            target: "#track-list div.row:first-child .choose-track-play-mode",
            content:
              "Choose in what order the notes are played, like in an arpeggiator.",
          },
          {
            target: "#track-list div.row:first-child .choose-track-related-to",
            content:
              "Choose if the notes (degrees) relate to the scale, the chord or are 'static' (in this case you'll want to enter raw MIDI notes, like 60 for C4).",
          },
          {
            target: "#track-list div.row:first-child .edit-track-rythm",
            content:
              "The rythm of the track (or groove) is expressed as a list of velocities. You can put some zeros in to have silences. The four fields below are, in order: Density, Probability, Amplitude and Center. If you use Density, your rythm will be overwritten by an euclidean rythm of 64 steps, filled with 'density' steps. Probability can randomly skip some notes. Amplitude and Center allow you to humanize your rythm a bit by randomly changing the velocity with an amount of Amplitude around Center.",
          },
          {
            target:
              "#track-list div.row:first-child .choose-track-base-velocity",
            content:
              "Base velocity is a multiplier for the rythm velocity and allows to mix the tracks volumes relative to each other.",
          },
          {
            target: "#track-list div.row:first-child .choose-track-preset",
            content:
              "Some presets are available for you to choose from, they will overwrite your note, division, rythm...",
          },
          {
            target: "#track-list div.row:first-child .remove-track",
            content: "Remove this track.",
          },
          {
            target: "#track-list div.row:first-child .change-track-view",
            content: "Switch to a different view of your track",
          },
        ],
        callbacks: {
          onFinish: () => {
            localStorage.setItem("skipTrackTour", "true");
          },
          onSkip: () => {
            localStorage.setItem("skipTrackTour", "true");
          },
          onStop: () => {
            localStorage.setItem("skipTrackTour", "true");
          },
          onStart: () => {
            localStorage.setItem("trackTourStart", "true");
          },
        },
      },
    };
  },
  computed: {
    chordProgressionComputed: {
      get() {
        return this.song.chordProgression.join(" ");
      },
      set(newValue: string) {
        this.song.load({
          chordProgression: newValue
            .split(" ")
            .map((val: string) => parseInt(val, 10)),
        });
      },
    },
  },
  methods: {
    cycleView() {
      if (this.viewType === "reduced") {
        this.viewType = "expand";
      } else if (this.viewType === "expand") {
        this.viewType = "perf";
      } else if (this.viewType === "perf") {
        this.viewType = "reduced";
      }
    },
  },
  mounted() {
    if (localStorage.getItem("skipPerfTour") !== "true") {
      this.$tours["perfTour"].start();
    }
  },
});
</script>

<template>
  <v-tour
    name="perfTour"
    :steps="tour.steps"
    :callbacks="tour.callbacks"
    :options="{ highlight: true }"
  ></v-tour>
  <v-tour
    name="trackTour"
    :steps="trackTour.steps"
    :callbacks="trackTour.callbacks"
    :options="{ highlight: true }"
  >
  </v-tour>
  <div class="row">
    <h1 class="col-12">Performance</h1>
    <div id="performance-zone" class="col-12 mb-2">
      <div class="row">
        <div class="col-2">
          <div class="btn-group" role="group" id="transport-buttons">
            <button
              class="btn btn-small btn-outline-primary"
              @click="
                () => {
                  playpause(true, true);
                }
              "
            >
              <i
                :class="
                  'bi bi-' +
                  (song.seqPlaying && song.tracksPlaying ? 'pause' : 'play') +
                  '-circle'
                "
              ></i>
            </button>
            <button
              class="btn btn-small btn-outline-primary"
              @click="
                () => {
                  playpause(true, false);
                }
              "
            >
              <i
                :class="
                  'bi bi-' + (song.seqPlaying ? 'pause' : 'play') + '-fill'
                "
              ></i>
            </button>
            <button class="btn btn-small btn-outline-primary" @click="panic">
              <i class="bi bi-stop-fill"></i>
            </button>
            <button class="btn btn-small btn-outline-primary" @click="rewind">
              <i class="bi bi-rewind-fill"></i>
            </button>
          </div>
        </div>
        <div id="key-parameters" class="col-6">
          <div class="input-group">
            <span class="input-group-text">Root</span>
            <select
              class="form-select"
              :value="song.rootNote"
              @change="(evt) => { song.load({ rootNote: parseInt((evt.target as HTMLSelectElement).value, 10) }); }"
            >
              <option value="60">C</option>
              <option value="61">C#</option>
              <option value="62">D</option>
              <option value="63">D#</option>
              <option value="64">E</option>
              <option value="65">F</option>
              <option value="66">F#</option>
              <option value="67">G</option>
              <option value="68">G#</option>
              <option value="69">A</option>
              <option value="70">A#</option>
              <option value="71">B</option>
            </select>
            <span class="input-group-text">Mode</span>
            <select
              class="form-select"
              :value="song.scale"
              @change="(ev: Event) => { song.load({ scale: (ev.target as HTMLSelectElement).value as Scale }); }"
            >
              <option>major</option>
              <option>minor</option>
            </select>
            <span class="input-group-text">{{
              scales[song.scale]
                .map((val: number) =>
                  noteNumberToName(val + song.rootNote, song, false)
                )
                .join(" ")
            }}</span>
          </div>
        </div>
        <div id="chords-control" class="col-4">
          <div class="input-group">
            <input
              class="form-control"
              id="chord-progression"
              v-model.lazy="chordProgressionComputed"
            />
            <select
              class="form-select"
              id="chord-type"
              :value="song.currentChordType"
              @change="(ev: Event) => { song.load({ currentChordType: (ev.target as HTMLSelectElement).value as ChordType }); }"
            >
              <option>triad</option>
              <option>power</option>
              <option>sus2</option>
              <option>sus4</option>
              <option>sixth</option>
              <option>seventh</option>
              <option>ninth</option>
              <option>eleventh</option>
            </select>
          </div>
          <input
            class="form-control hidden"
            type="number"
            min="1"
            max="7"
            :value="song.currentChord"
            @change="(ev: Event) => { song.load({ currentChord: parseInt((ev.target as HTMLInputElement).value, 10) }); }"
          />
          <div class="btn-group" role="group">
            <button
              class="btn btn-small btn-outline-primary"
              v-for="chordDegree of [1, 2, 3, 4, 5, 6, 7]"
              v-bind:key="chordDegree"
              @click="() => song.load({ currentChord: chordDegree })"
              :class="song.currentChord === chordDegree ? 'active' : ''"
            >
              {{ chordDegree }}
            </button>
          </div>
          <span class="push-right">
            {{ chords[song.currentChordType].join(" ") }}
          </span>
        </div>
      </div>
    </div>
    <div class="col-12">
      <div class="row">
        <div class="col-2">
          <div class="btn-group" role="group">
            <button
              class="btn btn-outline-primary"
              id="add-track"
              @click="
                () => {
                  playpause(false, true);
                }
              "
            >
              <i
                :class="
                  'bi bi-' + (song.tracksPlaying ? 'pause' : 'play') + '-fill'
                "
              ></i>
            </button>
            <ConfirmButton label="Remove all tracks" @confirmed="newProject">
              <i class="bi bi-radioactive"></i>
            </ConfirmButton>
            <button
              class="btn btn-outline-primary change-track-view"
              @click="cycleView"
            >
              <i class="bi bi-eye-fill"></i>
            </button>
            <button
              class="btn btn-outline-primary"
              id="add-track"
              @click="() => addTrack()"
            >
              <i class="bi bi-plus-circle"></i>
            </button>
          </div>
        </div>
        <div class="col-5">
          <div
            style="
              display: flex;
              align-items: center;
              justify-content: space-around;
            "
          >
            <form
              enctype="multipart/form-data"
              style="display: flex; align-items: center"
            >
              <div>
                <label
                  for="loadProjectFileInput"
                  class="btn btn-outline-primary form-label"
                >
                  Load project
                </label>
                <input
                  style="opacity: 0; position: absolute; z-index: 0"
                  class="form-control"
                  type="file"
                  id="loadProjectFileInput"
                  accept="application/json"
                  name="song"
                  @change="loadFile"
                />
              </div>
            </form>
          </div>
        </div>
        <div class="col-5">
          <div class="input-group" role="group">
            <button
              class="btn btn-outline-primary"
              @click="
                () => {
                  saveFile(fileName);
                }
              "
            >
              Save project
            </button>
            <input
              class="form-control"
              type="text"
              v-model="fileName"
              placeholder="Choose filename"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="col-12" id="track-list">
      <TrackList :song="song" :removeTrack="removeTrack" :viewType="viewType" />
    </div>
  </div>
</template>

<style scoped></style>
