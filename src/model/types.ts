import type { SavedTrackModel } from "@/model/TrackModel"


export type Scale = "major" | "minor";

export type ChordType = "triad" | "power" | "sus2" | "sus4" | "sixth" | "seventh" | "ninth" | "eleventh";

export interface SongData {
  rootNote: number
  scale: Scale
  currentChord: number
  currentChordType: ChordType
  chordProgression: number[]
}

export interface SavedSongModel extends SongData {
  tracks: SavedTrackModel[]
}

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
