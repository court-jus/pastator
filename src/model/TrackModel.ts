import type { SongModel } from "./SongModel";


const playNote = (port: MIDIOutput, channel: number, note: number, velocity: number, delay = 0) => {
  if (delay) {
    window.setTimeout(() => {
      playNote(port, channel, note, velocity);
    }, delay);
    return;
  }
  if (note > -1 && note < 128) port.send([0x80 | (1 << 4) | channel, note, velocity]);
};

const stopNote = (port: MIDIOutput, channel: number, note: number) => {
  if (note > -1 && note < 128) port.send([0x80 | (0 << 4) | channel, note, 64]);
};

export type SavedTrackModel = {
  gate: number;
  transpose: number;
  baseVelocity: number;
  division: number;
  gravityCenter?: number;
  gravityStrength?: number;
  strumDelay: number;
  availableDegrees: [];
  rythmDefinition: number[];
  maxNotes?: number;
  playMode: string;
  relatedTo: string;
  channel: number;
  presetId: string;
  presetCategory: string;
}

export class TrackModel {
  channel: number;
  division: number;
  gravityCenter?: number;
  gravityStrength?: number;
  currentNotes?: number[];
  gate: number;
  transpose: number;
  baseVelocity: number;
  strumDelay: number;
  rythmDefinition: number[];
  position?: number;
  playing?: boolean;
  timeout?: number;
  lastNotes?: number[];
  availableDegrees: number[];
  octaves: number[];
  maxNotes?: number;
  playMode: string;
  relatedTo: string;
  presetId?: string;
  presetCategory?: string;

  constructor() {
    this.channel = 0;
    this.division = 48;
    this.gate = 90;
    this.playMode = "random";
    this.relatedTo = "chord";
    this.transpose = 0;
    this.baseVelocity = 100;
    this.strumDelay = 0;
    this.rythmDefinition = [100];
    this.availableDegrees = [0, 1, 2];
    this.octaves = [0];
  }

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
  }}

