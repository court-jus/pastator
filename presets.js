"use strict";

export const presets = {
  custom: [
    {
      id: "custom",
      label: "Custom",
      notes: [],
      rythm: [],
      octaves: [0],
      division: 1,
    }
  ],
  bass: [
    {
      id: "rootbar",
      label: "Root note, 1 bar",
      notes: [0],
      rythm: [100],
      octaves: [0],
      division: 1,
    },
    {
      id: "widechord",
      label: "Wide chord, low",
      notes: [0, 1, 2, 3, 4],
      rythm: [100],
      octaves: [-1],
      division: 0.25
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
