import type {
  DegreesRelation,
  EuclideanMode,
  MelostepModel,
  MelotorModel,
  Preset,
} from "./types";
import {
  computeEuclidean,
  computeMelostep,
  computeMelotor,
  getNotes,
} from "./engine";
import { BarLength, rythmPresets, notesPresets } from "./presets";
import { SongModel } from "./SongModel";
import { v4 as uuidv4 } from "uuid";

export type RythmMode =
  | "manual"
  | "preset"
  | "16steps"
  | "euclidean"
  | "durations";
export type NotesMode =
  | "manual"
  | "preset"
  | "ponderated"
  | "melotor"
  | "melostep"
  | "random";

export class TrackModel {
  id: string;
  song: SongModel;
  channel: number;
  division: number;
  currentNotes: Record<number, number>;
  gate: number;
  transpose: number;
  baseVelocity: number;
  strumDelay: number;
  rythmDefinition: number[];
  notesPosition: number;
  rythmPosition: number;
  playing: boolean;
  availableDegrees: number[];
  octaves: number[];
  notesMode: NotesMode;
  rythmMode: RythmMode;
  playMode: "up" | "dn" | "updn" | "random" | "atonce" | "strum";
  relatedTo: DegreesRelation;
  gravityCenter: number;
  gravityStrength: number;
  euclideanMode?: EuclideanMode;
  rythmDensity?: number;
  velAmplitude?: number;
  velCenter?: number;
  proba?: number;
  preset?: Preset;
  presetId?: string;
  presetCategory?: string;
  melotor?: MelotorModel;
  melostep?: MelostepModel;
  singleShots?: number;
  debug?: boolean;
  cachedAvailableNotes?: number[];
  timeouts: ReturnType<typeof setTimeout>[];

  constructor(song: SongModel) {
    this.id = uuidv4();
    this.song = song;
    this.channel = 0;
    this.division = BarLength / 4;
    this.gate = 90;
    this.notesMode = "manual";
    this.rythmMode = "16steps";
    this.playMode = "up";
    this.relatedTo = "chord";
    this.transpose = 0;
    this.baseVelocity = 100;
    this.strumDelay = 0;
    this.rythmDefinition = new Array(16).fill(100);
    this.availableDegrees = [0, 1, 2];
    this.octaves = [0];
    this.currentNotes = {};
    this.playing = false;
    this.notesPosition = 0;
    this.rythmPosition = 0;
    this.singleShots = 0;
    this.timeouts = [];
    this.gravityCenter = 64;
    this.gravityStrength = 15;
  }

  // Load/Save/...
  apply(trackData: LoadableTrackModel) {
    Object.assign(this, trackData);
    this.octaves = trackData.octaves || [0];
    this.singleShots = trackData.singleShots || 0;
  }
  load(trackData: LoadableTrackModel) {
    this.apply(trackData);
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: this.save(),
      });
    }
  }
  save(): SavedTrackModel {
    // internalKeys: "notesPosition", "currentNotes", ...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      notesPosition,
      rythmPosition,
      currentNotes,
      cachedAvailableNotes,
      timeouts,
      song,
      ...dataToSave
    } = this;
    return dataToSave;
  }

  // Utilities (caching, setters...)
  getAvailableNotes(songData: SongModel) {
    if (
      this.cachedAvailableNotes === undefined ||
      this.cachedAvailableNotes.length === 0
    )
      return this.availableNotes(songData);
    return this.cachedAvailableNotes;
  }
  setEuclideanSettings({
    density,
    mode,
  }: {
    density?: number;
    mode?: EuclideanMode;
  }) {
    if (density !== undefined) this.rythmDensity = density;
    if (mode !== undefined) this.euclideanMode = mode;
    this.rythm();
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: {
          rythmDensity: this.rythmDensity,
          euclideanMode: this.euclideanMode,
        },
      });
    }
  }
  setChannel(newChannel: number) {
    this.stop();
    this.channel = newChannel;
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: { channel: this.channel },
      });
    }
  }

  // Transport
  play() {
    this.playing = true;
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: { playing: this.playing },
      });
    }
    if (this.division === 0) {
      // Run drones on play, without waiting for a clock
      this.emit();
    }
  }
  fullStop(panic = false) {
    if (panic) {
      this.stop();
    }
    this.rew();
    this.playing = false;
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: { playing: this.playing },
      });
    }
  }
  playpause() {
    if (this.playing) {
      this.stop();
      this.playing = false;
      if (
        this.song.architecture === "clientserver" ||
        this.song.architecture === "back"
      ) {
        this.song.callbacks?.remoteMessage("setTrack", {
          trackId: this.id,
          data: { playing: this.playing },
        });
      }
    } else {
      this.play();
    }
  }
  rew() {
    this.notesPosition = 0;
    this.rythmPosition = 0;
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: {
          notesPosition: this.notesPosition,
          rythmPosition: this.rythmPosition,
        },
      });
    }
  }
  addSingleShot() {
    this.singleShots =
      this.singleShots === undefined ? 1 : this.singleShots + 1;
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: {
          singleShots: this.singleShots,
        },
      });
    }
  }

  // MIDI
  // NoteOn
  emit() {
    const availableNotes = this.availableNotes(this.song);
    if (this.debug) console.log("aN", [...availableNotes]);
    const reversed = [...availableNotes].reverse();
    const upDn = availableNotes.concat(reversed);
    let duration = Math.trunc((this.division * this.gate) / 100);
    const playedNotes =
      this.playMode === "atonce" || this.playMode === "strum"
        ? availableNotes
        : this.playMode === "random"
        ? [availableNotes[Math.floor(Math.random() * availableNotes.length)]]
        : this.playMode === "up"
        ? [availableNotes[this.notesPosition % availableNotes.length]]
        : this.playMode === "dn"
        ? [
            availableNotes[
              availableNotes.length -
                1 -
                (this.notesPosition % availableNotes.length)
            ],
          ]
        : this.playMode === "updn"
        ? [upDn[this.notesPosition % upDn.length]]
        : [availableNotes[0]];
    if (this.rythmMode === "durations") {
      const totalDuration = this.rythmDefinition.reduce(
        (prev, curr) => prev + curr,
        0
      );
      const rythmPosition =
        (this.rythmPosition * this.division) % totalDuration;
      duration = this.rythmDefinition.reduce(
        (prev: [number, number], curr: number) => {
          const [chosen, total] = prev;
          if (chosen) return prev;
          if (total === rythmPosition) return [curr, 0] as [number, number];
          return [0, total + curr] as [number, number];
        },
        [0, 0]
      )[0];
    }
    this.rythmPosition = Math.trunc(this.song.clock / this.division);
    const velocity = this.rythm();
    if (velocity > 0 && this.channel !== undefined && duration > 0) {
      if (this.debug)
        console.log(
          this.channel,
          "emit",
          playedNotes,
          "at",
          this.notesPosition
        );
      let delay = 0;
      for (const note of playedNotes) {
        if (this.strumDelay > 0) {
          this.timeouts.push(
            setTimeout(() => {
              if (!this.playing && this.singleShots === 0) return;
              this.currentNotes[note + this.transpose] =
                this.song.clock + duration;
              this.song.callbacks?.playNote(
                this.channel,
                note + this.transpose,
                velocity
              );
            }, delay)
          );
          delay += this.playMode === "strum" ? this.strumDelay : 0;
        } else {
          this.currentNotes[note + this.transpose] = this.song.clock + duration;
          this.song.callbacks?.playNote(
            this.channel,
            note + this.transpose,
            velocity
          );
        }
      }
      this.notesPosition += 1;
    }
    if (this.singleShots !== undefined && this.singleShots > 0) {
      this.singleShots -= 1;
    }
  }
  // NoteOff
  stop() {
    if (Object.keys(this.currentNotes).length === 0) return;
    if (this.channel === undefined) return;
    for (const key of Object.keys(this.currentNotes)) {
      const currentNote = parseInt(key, 10);
      this.song.callbacks?.stopNote(this.channel, currentNote);
    }
    this.currentNotes = {};
    for (const timeout of this.timeouts) {
      clearTimeout(timeout);
    }
  }
  // CC
  receiveCC(cc: number, val: number) {
    if (cc === 4) {
      this.gravityCenter = val;
      if (!this.gravityStrength) this.gravityStrength = 12;
    } else if (cc === 3) {
      this.gravityStrength = Math.trunc((val / 127) * 27);
    } else if (cc === 2 && this.rythmMode === "euclidean") {
      this.rythmDensity = Math.trunc((val / 127) * 64);
    } else if (cc === 1) {
      this.proba = Math.trunc((val / 127) * 100);
    } else {
      console.log("I got CC", cc, val);
    }
  }
  // Clock
  tick(oldClock: number) {
    if (this.division === 0) return;
    // this.notesPosition = Math.trunc(newClock / this.division);
    if (
      Object.keys(this.currentNotes).length > 0 &&
      this.channel !== undefined
    ) {
      const stopped = [];
      for (const key of Object.keys(this.currentNotes)) {
        const currentNote = parseInt(key, 10);
        const timeToStop = this.currentNotes[currentNote];
        if (this.song.clock >= timeToStop) {
          this.song.callbacks?.stopNote(this.channel, currentNote);
          stopped.push(currentNote);
        }
      }
      for (const note of stopped) {
        delete this.currentNotes[note];
      }
    }
    if (this.song.clock % this.division === 0 || oldClock === 0) {
      if (
        this.playing ||
        (this.singleShots !== undefined && this.singleShots > 0)
      ) {
        if (this.debug)
          console.log(
            this.channel,
            "advance at",
            this.song.clock,
            "pos",
            this.notesPosition
          );
        this.emit();
      }
    }
  }

  // Music
  availableNotes(songData: SongModel) {
    // Get and cache available notes
    this.cachedAvailableNotes = this._availableNotes(songData);
    return this.cachedAvailableNotes;
  }
  _availableNotes(songData: SongModel) {
    this.recomputeMelo(songData);
    const candidateNotes = getNotes(
      songData,
      this.availableDegrees,
      this.octaves,
      this.relatedTo
    );
    if (this.relatedTo === "static") return candidateNotes;
    const [lowLimit, highLimit] = this.getNotesLimits();
    const [lowCandidate, highCandidate] = [
      Math.min(...candidateNotes),
      Math.max(...candidateNotes),
    ];
    const candidatesCenter =
      Math.trunc((highCandidate - lowCandidate) / 2) + lowCandidate;
    const shift = Math.trunc((this.gravityCenter - candidatesCenter) / 12) * 12;
    const shifted =
      this.relatedTo === "chord"
        ? candidateNotes.map((note: number) => note + shift)
        : candidateNotes;
    return shifted.map((note: number) => {
      if (note < lowLimit) {
        const transp = lowLimit - note;
        return note + transp + (12 - (transp % 12));
      }
      if (note > highLimit) {
        const transp = note - highLimit;
        return note - transp - (12 - (transp % 12));
      }
      return note;
    });
  }
  getNotesLimits() {
    const margin = Math.trunc((40 - this.gravityStrength) / 2);
    const lowLimit = Math.max(this.gravityCenter - margin, 0);
    const highLimit = Math.min(this.gravityCenter + margin, 127);
    return [lowLimit, highLimit];
  }
  rythm() {
    if (this.rythmDensity !== undefined && this.rythmMode === "euclidean") {
      // Euclidean Rythm
      this.rythmDefinition = [];
      for (let p = 0; p < 64; p++) {
        const x = p % 64;
        const euclidean = computeEuclidean(
          x,
          null,
          this.rythmDensity,
          64,
          this.euclideanMode || "linear"
        );
        this.rythmDefinition.push(euclidean === 1 ? 100 : 0);
      }
    }
    if (this.rythmMode === "durations") {
      let velocity = 100;
      if (this.velAmplitude !== undefined) {
        const center = this.velCenter !== undefined ? this.velCenter : 50;
        velocity = Math.floor(
          Math.random() * this.velAmplitude - this.velAmplitude / 2 + center
        );
      }
      const playProbability =
        (this.proba !== undefined ? this.proba : velocity) / 100;
      if (Math.random() >= playProbability) return 0;
      return (velocity * this.baseVelocity) / 100;
    }
    this.rythmDefinition = this.rythmDefinition.map((value: number) => {
      if (this.velAmplitude === undefined || value === 0) return value;
      const center = this.velCenter !== undefined ? this.velCenter : 50;
      return Math.floor(
        Math.random() * this.velAmplitude - this.velAmplitude / 2 + center
      );
    });
    const chosenVelocity =
      this.rythmDefinition[this.rythmPosition % this.rythmDefinition.length];
    const restThreshold = 100;
    if (chosenVelocity >= restThreshold) {
      return (chosenVelocity * this.baseVelocity) / 100;
    }
    const playProbability =
      (this.proba !== undefined ? this.proba : chosenVelocity) / restThreshold;
    if (Math.random() >= playProbability) return 0;
    return (chosenVelocity * this.baseVelocity) / 100;
  }
  presetChange(newPreset: Preset) {
    this.preset = newPreset;
    this.rythmDefinition = newPreset.rythm;
    this.octaves = newPreset.octaves;
    this.availableDegrees = newPreset.notes;
    this.division = newPreset.division;
    this.playMode = newPreset.playMode;
    this.relatedTo = newPreset.relatedTo;
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: {
          preset: this.preset,
          rythmDefinition: this.rythmDefinition,
          octaves: this.octaves,
          availableDegrees: this.availableDegrees,
          division: this.division,
          playMode: this.playMode,
          relatedTo: this.relatedTo,
        },
      });
    }
  }
  currentChordChange() {
    if (!this.playing && this.singleShots === 0) return;
    if (this.division === 0) {
      this.stop();
      this.emit();
    }
  }
  applyRythmMode(rythmMode: RythmMode) {
    this.rythmMode = rythmMode;
    if (this.rythmMode === "16steps") {
      this.rythmDefinition = this.rythmDefinition.slice(0, 16);
      if (this.rythmDefinition.length < 16) {
        this.rythmDefinition.push(
          ...new Array(16 - this.rythmDefinition.length).fill(0)
        );
      }
    } else if (this.rythmMode === "euclidean") {
      this.euclideanMode = "linear";
      const activeBeats = this.rythmDefinition.filter(
        (beat: number) => beat > 0
      ).length;
      const newDensity = (64 / this.rythmDefinition.length) * activeBeats;
      this.setEuclideanSettings({ density: newDensity });
    }
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: {
          rythmMode: this.rythmMode,
          rythmDefinition: this.rythmDefinition,
          euclideanMode: this.euclideanMode,
        },
      });
    }
  }
  applyNotesMode(notesMode: NotesMode) {
    this.notesMode = notesMode;
    if (this.notesMode === "melotor") {
      this.playMode = "up";
      this.relatedTo = "scale";
      if (this.melotor === undefined) {
        this.melotor = {
          currentMelo: [],
          meloChangeDiv: BarLength / this.division,
          meloChangeStrength: 20,
          meloLength: 4,
          notesProbabilities: [100, 16, 60, 15, 40, 20, 50],
          chordInfluence: 25,
        };
      }
      const newMelo = computeMelotor(
        this.melotor,
        this.rythmPosition,
        this.division,
        this.song
      );
      if (newMelo) {
        this.melotor.currentMelo = newMelo;
        this.cachedAvailableNotes = undefined;
      }
    } else if (this.notesMode === "melostep") {
      this.playMode = "up";
      this.relatedTo = "scale";
      if (this.melostep === undefined) {
        this.melostep = {
          input: "*UDu_duD",
        };
      }
    }
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: {
          relatedTo: this.relatedTo,
          playMode: this.playMode,
          notesMode: this.notesMode,
          melotor: this.melotor,
        },
      });
    }
  }
  applyRythmPreset(rythmId: string) {
    if (rythmId === "nil") return;
    const rythm = rythmPresets[rythmId].data;
    this.rythmDefinition = rythm;
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: {
          rythmDefinition: this.rythmDefinition,
        },
      });
    }
  }
  applyNotesPreset(presetId: string) {
    if (presetId === "nil") return;
    const notes = notesPresets[presetId];
    this.availableDegrees = notes.data;
    this.relatedTo = notes.relatedTo;
    if (
      this.song.architecture === "clientserver" ||
      this.song.architecture === "back"
    ) {
      this.song.callbacks?.remoteMessage("setTrack", {
        trackId: this.id,
        data: {
          availableDegrees: this.availableDegrees,
          relatedTo: this.relatedTo,
        },
      });
    }
  }
  recomputeMelo(songData: SongModel) {
    if (this.melotor && this.notesMode === "melotor") {
      const newMelo = computeMelotor(
        this.melotor,
        this.rythmPosition,
        this.division,
        songData
      );
      if (newMelo) {
        this.melotor.currentMelo = newMelo;
        this.availableDegrees = this.melotor.currentMelo;
        if (this.song.architecture === "back") {
          this.song.callbacks?.remoteMessage("setTrack", {
            trackId: this.id,
            data: {
              melotor: this.melotor,
              availableDegrees: this.availableDegrees,
            },
          });
        }
      }
    } else if (this.melostep && this.notesMode === "melostep") {
      const newMelo = computeMelostep(
        this.melostep,
        this.rythmPosition,
        this.division,
        songData
      );
      if (newMelo) {
        this.availableDegrees = newMelo;
        if (this.song.architecture === "back") {
          this.song.callbacks?.remoteMessage("setTrack", {
            trackId: this.id,
            data: {
              melostep: this.melostep,
              availableDegrees: this.availableDegrees,
            },
          });
        }
      }
    }
  }
}

export type SavedTrackModel = Pick<
  TrackModel,
  | "channel"
  | "division"
  | "gate"
  | "transpose"
  | "baseVelocity"
  | "strumDelay"
  | "rythmDefinition"
  | "availableDegrees"
  | "octaves"
  | "notesMode"
  | "rythmMode"
  | "playMode"
  | "relatedTo"
  | "gravityCenter"
  | "gravityStrength"
  | "rythmDensity"
  | "velAmplitude"
  | "velCenter"
  | "proba"
  | "preset"
  | "presetId"
  | "presetCategory"
  | "melotor"
  | "melostep"
  | "singleShots"
  | "playing"
>;

export type LoadableTrackModel = Partial<SavedTrackModel>;
