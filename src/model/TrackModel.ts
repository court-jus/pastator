import type { Preset, SongData } from "./types";
import { getNotes, playNote, stopNote } from "./engine";

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
  playMode: string;
  relatedTo: string;
  channel: number;
  presetId: string;
  presetCategory: string;
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
  playMode: string;
  relatedTo: string;
  preset?: Preset;
  presetId?: string;
  presetCategory?: string;

  constructor(device: MIDIOutput) {
    this.device = device;
    this.channel = 0;
    this.division = 96;
    this.gate = 90;
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
    };
    return dataToSave;
  }

  // Transport
  play() {
    this.playing = true;
  }
  fullStop(panic = false) {
    if (panic) this.stop();
    this.playing = false;
  }
  playpause() {
    if (this.playing) {
      this.fullStop(true);
    } else {
      this.playing = true;
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

  // Music
  availableNotes(songData: SongData) {
    const candidateNotes = getNotes(
      songData,
      this.availableDegrees,
      this.octaves,
      this.relatedTo
    );
    if (
      this.gravityCenter === undefined ||
      this.gravityStrength === undefined
    ) {
      return candidateNotes;
    }
    const margin = Math.trunc((140 - this.gravityStrength) / 2);
    const lowerBound = Math.max(this.gravityCenter - margin, 0);
    const higherBound = Math.min(this.gravityCenter + margin, 127);
    return candidateNotes.map((note: number) => {
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
        let velocity = 100;
        if (this.velAmplitude !== undefined) {
          const center = this.velCenter !== undefined ? this.velCenter : 50;
          velocity = Math.floor(
            Math.random() * this.velAmplitude - this.velAmplitude / 2 + center
          );
        }
        this.rythmDefinition.push(prev_value !== new_value ? velocity : 0);
      }
    }
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
}
