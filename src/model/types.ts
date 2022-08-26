import { SongModel } from "./SongModel";
import type { TrackModel } from "./TrackModel"


export type Scale = "major" | "minor";

export type ChordType = "triad" | "power" | "sus2" | "sus4" | "sixth" | "seventh" | "ninth" | "eleventh";

export interface Preset {
  id: string
  label: string
  notes: number[],
  rythm: number[],
  octaves: number[],
  division: number,
  playMode: "up" | "dn" | "updn" | "random" | "atonce" | "strum",
  relatedTo: "chord" | "scale" | "invchord" | "static",
}

export type PresetCategories = Record<string, Preset[]>;

export type DegreesRelation = "chord" | "scale" | "invchord" | "static";

export type EuclideanMode = "linear" | "sinus" | "dexp" | "uexp";

export type MelotorModel = {
  notesProbabilities: number[];
  currentMelo: number[];
  meloLength: number;
  meloChangeDiv: number;
  meloChangeStrength: number;
  chordInfluence: number;
};

export type CallBacks = {
  playNote: (channel: number, note: number, velocity: number) => void;
  stopNote: (channel: number, note: number) => void;
  remoteMessage: (messageType: string, data: any) => void;
};

export type WsMessage = {
  messageType: string;
  messageData: Record<string, any>;
};


