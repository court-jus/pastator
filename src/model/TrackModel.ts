import type { DegreesRelation, EuclideanMode, Preset, SongData } from "./types";
import { computeEuclidean, computeMelotor, getNotes, playNote, stopNote } from "./engine";
import { BarLength, rythmPresets, notesPresets } from "./presets";

export type MelotorModel = {
  notesProbabilities: number[];
  currentMelo: number[];
  meloLength: number;
  meloChangeDiv: number;
  meloChangeStrength: number;
};

export type RythmMode = "manual" | "preset" | "16steps" | "euclidean";
export type NotesMode = "manual" | "preset" | "ponderated" | "melotor" | "random";

export class TrackModel {
  device: MIDIOutput;
  channel: number;
  division: number;
  currentNotes: number[];
  gate: number;
  transpose: number;
  baseVelocity: number;
  strumDelay: number;
  rythmDefinition: number[];
  position: number;
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
  singleShots?: number;
  debug?: boolean;
  cachedAvailableNotes?: number[];
  timeouts: number[];

  constructor(device: MIDIOutput) {
    this.device = device;
    this.channel = 0;
    this.division = BarLength;
    this.gate = 90;
    this.notesMode = "manual";
    this.rythmMode = "preset";
    this.playMode = "random";
    this.relatedTo = "chord";
    this.transpose = 0;
    this.baseVelocity = 100;
    this.strumDelay = 0;
    this.rythmDefinition = [100];
    this.availableDegrees = [0, 1, 2];
    this.octaves = [0];
    this.currentNotes = [];
    this.playing = false;
    this.position = 0;
    this.singleShots = 0;
    this.timeouts = [];
    this.gravityCenter = 64;
    this.gravityStrength = 1;
  }

  // Load/Save/...
  load(trackData: SavedTrackModel) {
    Object.assign(this, trackData);
    this.octaves = trackData.octaves || [0];
    this.singleShots = trackData.singleShots || 0;
  }
  save() {
    // internalKeys: "device", "position", "playing", "currentNotes"
    const {device, position, playing, currentNotes, ...dataToSave} = this;
    return dataToSave;
  }

  // Utilities (caching, setters...)
  getAvailableNotes(songData: SongData) {
    if(this.cachedAvailableNotes === undefined || this.cachedAvailableNotes.length === 0) return this.availableNotes(songData);
    return this.cachedAvailableNotes;
  }
  setEuclideanSettings({density, mode}: {density?: number, mode?: EuclideanMode}) {
    if (density !== undefined) this.rythmDensity = density;
    if (mode !== undefined) this.euclideanMode = mode;
    this.rythm();
  }

  // Transport
  play(songData: SongData) {
    this.playing = true;
    if (this.division === 0) {
      // Run drones on play, without waiting for a clock
      this.emit(songData);
    }
  }
  fullStop(panic = false) {
    if (panic) this.stop();
    this.playing = false;
  }
  playpause(songData: SongData) {
    if (this.playing) {
      this.fullStop(true);
    } else {
      this.play(songData);
    }
  }
  addSingleShot() {
    this.singleShots =
      this.singleShots === undefined ? 1 : this.singleShots + 1;
  }

  // MIDI
  // NoteOn
  emit(songData: SongData) {
    const availableNotes = this.availableNotes(songData);
    const reversed = [...availableNotes].reverse();
    const upDn = availableNotes.concat(reversed);
    const playedNotes =
      this.playMode === "atonce" || this.playMode === "strum"
        ? availableNotes
        : this.playMode === "random"
        ? [availableNotes[Math.floor(Math.random() * availableNotes.length)]]
        : this.playMode === "up"
        ? [availableNotes[this.position % availableNotes.length]]
        : this.playMode === "dn"
        ? [
            availableNotes[
              availableNotes.length -
                1 -
                (this.position % availableNotes.length)
            ],
          ]
        : this.playMode === "updn"
        ? [upDn[this.position % upDn.length]]
        : [availableNotes[0]];
    const velocity = this.rythm();
    if (velocity > 0 && this.channel !== undefined) {
      if (this.debug) console.log(this.channel, "emit", playedNotes, "at", this.position);
      let delay = 0;
      for (const note of playedNotes) {
        if (this.strumDelay > 0) {
          this.timeouts.push(window.setTimeout(() => {
            if (!this.playing && this.singleShots === 0) return;
            this.currentNotes.push(note + this.transpose);
            playNote(this.device, this.channel, note + this.transpose, velocity);
          }, delay));
          delay += this.playMode === "strum" ? this.strumDelay : 0;
        } else {
          this.currentNotes.push(note + this.transpose);
          playNote(this.device, this.channel, note + this.transpose, velocity);
        }
      }
    }
    if (this.singleShots !== undefined && this.singleShots > 0) {
      this.singleShots -= 1;
    }
  }
  // NoteOff
  stop() {
    if (this.currentNotes.length === 0) return;
    if (this.channel === undefined) return;
    for (const currentNote of this.currentNotes) {
      stopNote(this.device, this.channel, currentNote);
    }
    for (const timeout of this.timeouts) {
      window.clearTimeout(timeout);
    }
    this.currentNotes = [];
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
  tick(newClock: number, songData: SongData) {
    if (this.division === 0) return;
    this.position = Math.trunc(newClock / this.division);
    if (newClock % this.division === 0) {
      if (this.gate === 100) this.stop();
      if (
        this.playing ||
        (this.singleShots !== undefined && this.singleShots > 0)
      ) {
        if (this.debug) console.log(this.channel, "advance at", newClock, "pos", this.position);
        this.emit(songData);
      }
    } else if (this.gate < 100) {
      const pcLow = ((newClock % this.division) / this.division) * 100;
      const pcHigh = (((newClock + 1) % this.division) / this.division) * 100;
      if (pcHigh < pcLow || (pcLow < this.gate && pcHigh >= this.gate)) {
        this.stop();
      }
    }
  }

  // Music
  availableNotes(songData: SongData) {
    // Get and cache available notes
    this.cachedAvailableNotes = this._availableNotes(songData);
    return this.cachedAvailableNotes;
  }
  _availableNotes(songData: SongData) {
    if (this.melotor !== undefined && this.notesMode === "melotor") {
      this.recomputeMelotor();
    }
    const candidateNotes = getNotes(
      songData,
      this.availableDegrees,
      this.octaves,
      this.relatedTo
    );
    if (this.relatedTo === "static") return candidateNotes;
    const [lowLimit, highLimit] = this.getNotesLimits();
    const [lowCandidate, highCandidate] = [Math.min(...candidateNotes), Math.max(...candidateNotes)];
    const candidatesCenter = Math.trunc((highCandidate - lowCandidate) / 2) + lowCandidate;
    const shift = Math.trunc((this.gravityCenter - candidatesCenter) / 12) * 12;
    const shifted = (this.relatedTo === "chord") ? candidateNotes.map((note: number) => note + shift) : candidateNotes;
    return shifted
      .map((note: number) => {
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
    if (this.rythmDensity !== undefined && this.rythmMode === 'euclidean') {
      // Euclidean Rythm
      this.rythmDefinition = [];
      for (let p = 0; p < 64; p++) {
        const x = p % 64;
        const euclidean = computeEuclidean(x, null, this.rythmDensity, 64, this.euclideanMode || "linear");
        this.rythmDefinition.push(euclidean === 1 ? 100 : 0);
      }
    }
    this.rythmDefinition = this.rythmDefinition.map((value: number) => {
      if (this.velAmplitude === undefined || value === 0) return value;
      const center = this.velCenter !== undefined ? this.velCenter : 50;
      return Math.floor(
        Math.random() * this.velAmplitude - this.velAmplitude / 2 + center
      );
    });
    const chosenVelocity =
      this.rythmDefinition[this.position % this.rythmDefinition.length];
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
  }
  currentChordChange(songData: SongData) {
    if (!this.playing && this.singleShots === 0) return;
    if (this.division === 0) {
      this.stop();
      this.emit(songData);
    }
  }
  applyRythmMode(rythmMode: RythmMode) {
    this.rythmMode = rythmMode;
    if (this.rythmMode === '16steps') {
      this.rythmDefinition = this.rythmDefinition.slice(0, 16);
      if (this.rythmDefinition.length < 16) {
        this.rythmDefinition.push(...(new Array(16 - this.rythmDefinition.length).fill(0)));
      }
    } else if (this.rythmMode === 'euclidean') {
      this.euclideanMode = "linear";
      const activeBeats = this.rythmDefinition.filter((beat: number) => beat > 0).length;
      const newDensity = 64 / this.rythmDefinition.length * activeBeats;
      this.setEuclideanSettings({density: newDensity});
    }
  }
  applyNotesMode(notesMode : NotesMode) {
    this.notesMode = notesMode;
    if (this.notesMode === 'melotor') {
      this.playMode = "up";
      this.relatedTo = "scale";
      if (this.melotor === undefined) {
        this.melotor = {
          currentMelo: [],
          meloChangeDiv: BarLength / this.division,
          meloChangeStrength: 20,
          meloLength: 4,
          notesProbabilities: [100, 16, 60, 15, 40, 20, 50]
        }
      }
      this.melotor.currentMelo = computeMelotor(this.melotor, this.position);
      this.cachedAvailableNotes = undefined;
    }
  }
  applyRythmPreset(rythmId: string) {
    if (rythmId === "nil") return;
    const rythm = rythmPresets[rythmId].data;
    this.rythmDefinition = rythm;
  }
  applyNotesPreset(presetId: string) {
    if (presetId === "nil") return;
    const notes = notesPresets[presetId];
    this.availableDegrees = notes.data;
    this.relatedTo = notes.relatedTo;
  }
  recomputeMelotor(force = false) {
    if (this.melotor) {
      this.melotor.currentMelo = computeMelotor(this.melotor, this.position, force);
      this.availableDegrees = this.melotor.currentMelo;
    }
  }

}


export type SavedTrackModel = Pick<TrackModel,
  "channel" |
  "division" |
  "gate" |
  "transpose" |
  "baseVelocity" |
  "strumDelay" |
  "rythmDefinition" |
  "availableDegrees" |
  "octaves" |
  "notesMode" |
  "rythmMode" |
  "playMode" |
  "relatedTo" |
  "gravityCenter" |
  "gravityStrength" |
  "rythmDensity" |
  "velAmplitude" |
  "velCenter" |
  "proba" |
  "preset" |
  "presetId" |
  "presetCategory" |
  "melotor" |
  "singleShots"
>;
