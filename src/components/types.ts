
export interface SongData {
  rootNote: number
  scale: "major" | "minor"
  currentChord: number
  currentChordType: "triad" | "power" | "sus2" | "sus4" | "sixth" | "seventh" | "ninth" | "eleventh"
  chordProgression: number[]
}

export interface Preset {
  id: string
  label: string
  notes: number[],
  rythm: number[],
  octaves: number[],
  division: number,
  playMode: string,
  relatedTo: string,
}

export type PresetCategories = Record<string, Preset[]>;
