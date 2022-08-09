import type { DegreesRelation, Preset, SongData } from "./types";
import { computeMelotor, getNotes, playNote, stopNote } from "./engine";
import { BarLength, rythmPresets, notesPresets } from "./presets";

export type MelotorModel = {
  notesProbabilities: number[];
  currentMelo: number[];
  meloLength: number;
  meloChangeDiv: number;
  meloChangeStrength: number;
};

export type RythmMode = "manual" | "preset" | "16steps" | "euclidean";

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
  notesMode: "manual" | "preset" | "ponderated" | "random";
  rythmMode: RythmMode;
  playMode: "up" | "dn" | "updn" | "random" | "atonce" | "strum";
  relatedTo: DegreesRelation;
  gravityCenter?: number;
  gravityStrength?: number;
  rythmDensity?: number;
  velAmplitude?: number;
  velCenter?: number;
  proba?: number;
  timeout?: number;
  lastNotes?: number[];
  maxNotes?: number;
  preset?: Preset;
  presetId?: string;
  presetCategory?: string;
  melotor?: MelotorModel;

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
    this.strumDelay = 150;
    this.rythmDefinition = [100];
    this.availableDegrees = [0, 1, 2];
    this.octaves = [0];
    this.currentNotes = [];
    this.playing = false;
    this.position = 0;
  }

  // Load/Save/...
  load(trackData: SavedTrackModel) {
    Object.assign(this, trackData);
  }
  save() {
    // internalKeys: "device", "position", "playing", "currentNotes"
    const {device, position, playing, currentNotes, ...dataToSave} = this;
    return dataToSave;
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
      let delay = 0;
      for (const note of playedNotes) {
        window.setTimeout(() => {
          if (!this.playing) return;
          this.currentNotes.push(note + this.transpose);
          playNote(
            this.device,
            this.channel,
            note + this.transpose,
            velocity
          );
        }, delay);
        delay += this.playMode === "strum" ? this.strumDelay : 0;
      }
    }
  }
  // NoteOff
  stop() {
    if (this.currentNotes.length === 0) return;
    if (this.channel === undefined) return;
    for (const currentNote of this.currentNotes) {
      stopNote(this.device, this.channel, currentNote);
    }
    this.currentNotes = [];
  }
  // CC
  receiveCC(cc: number, val: number) {
    if (cc === 1) {
      this.gravityCenter = val;
    } else if (cc === 2) {
      this.gravityStrength = val;
    } else if (cc === 4) {
      this.baseVelocity = val;
    } else {
      console.log("I got CC", cc, val);
    }
  }
  // Clock
  tick(newClock: number, songData: SongData) {
    if (this.division === 0) return;
    this.position = Math.trunc(newClock / this.division);
    if (!this.playing) return;
    if (newClock % this.division === 0) {
      if (this.gate === 100) this.stop();
      this.emit(songData);
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
    if (this.melotor !== undefined) {
      this.melotor.currentMelo = computeMelotor(this.melotor, this.position);
      this.availableDegrees = this.melotor.currentMelo;
    }
    const candidateNotes = getNotes(
      songData,
      this.availableDegrees,
      this.octaves,
      this.relatedTo
    );
    if (
      !this.gravityCenter ||
      !this.gravityStrength
    ) {
      return candidateNotes;
    }
    const [lowLimit, highLimit] = this.getNotesLimits();
    const [lowCandidate, highCandidate] = [Math.min(...candidateNotes), Math.max(...candidateNotes)];
    const candidatesCenter = Math.trunc((highCandidate - lowCandidate) / 2) + lowCandidate;
    const shift = this.gravityCenter - candidatesCenter;
    return candidateNotes
      .map((note: number) => note + shift)
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
      })
      .sort();
  }
  getNotesLimits() {
    if (!this.gravityCenter || !this.gravityStrength) return [];
    const margin = Math.trunc((40 - this.gravityStrength) / 2);
    const lowLimit = Math.max(this.gravityCenter - margin, 0);
    const highLimit = Math.min(this.gravityCenter + margin, 127);
    return [lowLimit, highLimit];
  }
  rythm() {
    if (this.rythmDensity && this.rythmMode === 'euclidean') {
      // Euclidean Rythm
      this.rythmDefinition = [];
      for (let p = 0; p < 64; p++) {
        const x = p % 64;
        const xprev = (x - 1) % 64;
        const prev_value = Math.floor((xprev * this.rythmDensity) / 64);
        const new_value = Math.floor((x * this.rythmDensity) / 64);
        this.rythmDefinition.push(prev_value !== new_value ? 100 : 0);
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
    if (!this.playing) return;
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
      // const refDivision = this.division === 0 ? BarLength : this.division;
      const activeBeats = this.rythmDefinition.filter((beat: number) => beat > 0).length;
      const newDensity = 64 / this.rythmDefinition.length * activeBeats;
      this.rythmDensity = newDensity;
      this.rythm();
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
}


export type SavedTrackModel = Omit<TrackModel,
  "device" |
  "position" |
  "playing" |
  "load" |
  "save" |
  "currentNotes" |
  "play" |
  "fullStop" |
  "playpause" |
  "stop" |
  "emit" |
  "receiveCC" |
  "tick" |
  "availableNotes" |
  "getNotesLimits" |
  "rythm" |
  "presetChange" |
  "currentChordChange" |
  "applyRythmPreset" |
  "applyRythmMode" |
  "applyNotesPreset"
>;
