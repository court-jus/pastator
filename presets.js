"use strict";

export const presets = {
  bass: [
    {
      id: "root",
      label: "Root note, 1 bar",
      notes: [0],
      rythm: [100],
      octaves: [-1],
      division: 1,
      playMode: "up",
      relatedTo: "chord"
    },
    {
      id: "widechord",
      label: "Wide chord, low",
      notes: [0, 1, 2, 3],
      rythm: [100, 90, 80, 70, 80, 80],
      octaves: [-1],
      division: 0.125,
      playMode: "up",
      relatedTo: "chord"
    }
  ],
  lead: [
    {
      id: "scale",
      label: "Whole scale",
      notes: [0, 1, 2, 3, 4, 5, 6, 7],
      rythm: [100],
      octaves: [0],
      division: 0.125,
      playMode: "random",
      relatedTo: "scale"
    },
    {
      id: "ponderatedscale",
      label: "Ponderated scale",
      notes: [0, 0, 0, 0, 0, 1, 2, 2, 3, 4, 4, 4, 5, 6, 7, 7, 7],
      rythm: [100],
      octaves: [0],
      division: 0.125,
      playMode: "random",
      relatedTo: "scale"
    },
    {
      id: "varponderatedscale",
      label: "Var. Ponderated scale",
      notes: [0, 0, 0, 0, 0, 1, 2, 2, 3, 4, 4, 4, 5, 6, 7, 7, 7],
      rythm: [100, 25, 50, 60, 80, 35, 40, 70, 90, 45, 70, 20, 85, 25, 35, 30],
      octaves: [-1, 0],
      division: 0.125,
      playMode: "random",
      relatedTo: "scale"
    }
  ]
};

export const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export const chords = {
  triad: [1, 3, 5],
  seventh: [1, 3, 5, 7],
};
