"use strict";
import type { PresetCategories } from "@/model/types";

export const presets: PresetCategories = {
  bass: [
    {
      id: "root",
      label: "Root note, 1 bar",
      notes: [0],
      rythm: [100],
      octaves: [-1],
      division: 96,
      playMode: "up",
      relatedTo: "chord",
    },
    {
      id: "widechord",
      label: "Wide chord, low",
      notes: [0, 1, 2, 3],
      rythm: [100, 90, 80, 70, 80, 80],
      octaves: [-1],
      division: 24,
      playMode: "up",
      relatedTo: "chord",
    },
    {
      id: "groovy",
      label: "Groovy",
      notes: [0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 7, 7],
      rythm: [100], // , 20, 90, 30, 80, 30, 70, 20, 80, 40, 80],
      octaves: [-1],
      division: 12,
      playMode: "up",
      relatedTo: "chord",
    },
  ],
  pad: [
    {
      id: "widechord",
      label: "Wide chord, low",
      notes: [0, 1, 2, 3, 4, 5],
      rythm: [100],
      octaves: [0],
      division: 0,
      playMode: "atonce",
      relatedTo: "chord",
    },
    {
      id: "drone",
      label: "Drone",
      notes: [0],
      rythm: [100],
      octaves: [-1],
      division: 0,
      playMode: "atonce",
      relatedTo: "scale",
    },
  ],
  lead: [
    {
      id: "scale",
      label: "Whole scale",
      notes: [0, 1, 2, 3, 4, 5, 6, 7],
      rythm: [100],
      octaves: [0],
      division: 24,
      playMode: "random",
      relatedTo: "scale",
    },
    {
      id: "ponderatedscale",
      label: "Ponderated scale",
      notes: [0, 0, 0, 0, 1, 2, 2, 3, 4, 4, 4, 5, 6, 7, 7, 7],
      rythm: [100],
      octaves: [0],
      division: 24,
      playMode: "random",
      relatedTo: "scale",
    },
    {
      id: "varponderatedscale",
      label: "Var. Ponderated scale",
      notes: [0, 0, 0, 0, 1, 2, 2, 3, 4, 4, 4, 5, 6, 7, 7, 7],
      rythm: [100, 25, 50, 60, 80, 35, 40, 70, 90, 45, 70, 20, 85, 25, 35, 30],
      octaves: [-1, 0],
      division: 24,
      playMode: "random",
      relatedTo: "scale",
    },
  ],
  drums: [
    {
      id: "kick13",
      label: "Kick on 1, 3",
      notes: [36],
      rythm: [100, 0, 100, 0],
      octaves: [0],
      division: 24,
      playMode: "random",
      relatedTo: "static",
    },
    {
      id: "snare24",
      label: "Snare on 2, 4",
      notes: [38],
      rythm: [0, 100, 0, 100],
      octaves: [0],
      division: 24,
      playMode: "random",
      relatedTo: "static",
    },
    {
      id: "chhn",
      label: "Closed HH, halfnotes",
      notes: [42],
      rythm: [90, 75, 80, 75, 90, 65, 100, 70, 95, 60, 60, 85, 90, 45, 80, 75],
      octaves: [0],
      division: 12,
      playMode: "random",
      relatedTo: "static",
    },
  ],
};

export const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export const chords = {
  triad: [1, 3, 5],
  power: [1, 5, 8],
  sus2: [1, 2, 5],
  sus4: [1, 4, 5],
  sixth: [1, 3, 5, 6],
  seventh: [1, 3, 5, 7],
  ninth: [1, 3, 5, 7, 9],
  eleventh: [1, 3, 5, 7, 9, 11],
};
