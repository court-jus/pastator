import type { Preset, SongData } from "./types";
import { computeMelotor, getNotes, playNote, stopNote } from "./engine";

export type MelotorModel = {
  notesProbabilities: number[];
  currentMelo: number[];
  meloLength: number;
  meloChangeDiv: number;
  meloChangeStrength: number;
};

export type SavedTrackModel = {
  gate: number;
  transpose: number;
  baseVelocity: number;
  division: number;
  gravityCenter?: number;
  gravityStrength?: number;
  strumDelay: number;
  availableDegrees: number[];
  rythmDefinition: number[];
  rythmDensity?: number;
  velAmplitude?: number;
  velCenter?: number;
  proba?: number;
  maxNotes?: number;
  playMode: "up" | "dn" | "updn" | "random" | "atonce" | "strum";
  relatedTo: "chord" | "scale" | "invchord" | "static";
  channel: number;
  presetId: string;
  presetCategory: string;
  octaves?: number[];
  melotor?: MelotorModel;
  singleShots?: number;
};

export class TrackModel {
  device: MIDIOutput;
  channel: number;
  division: number;
  gravityCenter?: number;
  gravityStrength?: number;
  currentNotes: number[];
  gate: number;
  transpose: number;
  baseVelocity: number;
  strumDelay: number;
  rythmDefinition: number[];
  rythmDensity?: number;
  velAmplitude?: number;
  velCenter?: number;
  proba?: number;
  position: number;
  playing: boolean;
  timeout?: number;
  lastNotes?: number[];
  availableDegrees: number[];
  octaves: number[];
  maxNotes?: number;
  playMode: "up" | "dn" | "updn" | "random" | "atonce" | "strum";
  relatedTo: "chord" | "scale" | "invchord" | "static";
  preset?: Preset;
  presetId?: string;
  presetCategory?: string;
  melotor?: MelotorModel;
  singleShots?: number;

  constructor(device: MIDIOutput) {
    this.device = device;
    this.channel = 0;
    this.division = 96;
    this.gate = 90;
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
  }

  // Load/Save/...
  load(trackData: SavedTrackModel) {
    this.gate = trackData.gate;
    this.transpose = trackData.transpose;
    this.baseVelocity = trackData.baseVelocity;
    this.division = trackData.division;
    this.gravityCenter = trackData.gravityCenter;
    this.gravityStrength = trackData.gravityStrength;
    this.strumDelay = trackData.strumDelay;
    this.rythmDefinition = trackData.rythmDefinition;
    this.maxNotes = trackData.maxNotes;
    this.playMode = trackData.playMode;
    this.relatedTo = trackData.relatedTo;
    this.channel = trackData.channel;
    this.availableDegrees = trackData.availableDegrees;
    this.presetId = trackData.presetId;
    this.presetCategory = trackData.presetCategory;
    this.rythmDensity = trackData.rythmDensity;
    this.proba = trackData.proba;
    this.velAmplitude = trackData.velAmplitude;
    this.velCenter = trackData.velCenter;
    this.melotor = trackData.melotor;
    this.octaves = trackData.octaves || [0];
    this.singleShots = trackData.singleShots || 0;
  }
  save() {
    const dataToSave: SavedTrackModel = {
      gate: this.gate,
      transpose: this.transpose,
      baseVelocity: this.baseVelocity,
      division: this.division,
      gravityCenter: this.gravityCenter,
      gravityStrength: this.gravityStrength,
      strumDelay: this.strumDelay,
      rythmDefinition: this.rythmDefinition,
      maxNotes: this.maxNotes,
      playMode: this.playMode,
      relatedTo: this.relatedTo,
      channel: this.channel,
      availableDegrees: this.availableDegrees,
      presetId: this.presetId || "nil",
      presetCategory: this.presetCategory || "nil",
      rythmDensity: this.rythmDensity,
      proba: this.proba,
      velAmplitude: this.velAmplitude,
      velCenter: this.velCenter,
      melotor: this.melotor,
      octaves: this.octaves,
      singleShots: this.singleShots,
    };
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
      let delay = 0;
      for (const note of playedNotes) {
        if (this.strumDelay > 0) {
          window.setTimeout(() => {
            if (!this.playing && this.singleShots === 0) return;
            this.currentNotes.push(note + this.transpose);
            playNote(
              this.device,
              this.channel,
              note + this.transpose,
              velocity
            );
          }, delay);
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
    if (newClock % this.division === 0) {
      if (this.gate === 100) this.stop();
      if (
        this.playing ||
        (this.singleShots !== undefined && this.singleShots > 0)
      )
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
    if (!this.gravityCenter || !this.gravityStrength) {
      return candidateNotes;
    }
    const [lowLimit, highLimit] = this.getNotesLimits();
    const [lowCandidate, highCandidate] = [
      Math.min(...candidateNotes),
      Math.max(...candidateNotes),
    ];
    const candidatesCenter =
      Math.trunc((highCandidate - lowCandidate) / 2) + lowCandidate;
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
    if (this.rythmDensity) {
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
    if (!this.playing && this.singleShots === 0) return;
    if (this.division === 0) {
      this.stop();
      this.emit(songData);
    }
  }
}
