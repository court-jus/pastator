"use strict";

import { scales, chords } from "./presets.js";

export const getNotes = (notes, octaves) => {
  const root = parseInt(document.getElementById("root-note").value, 10);
  const scale = document.getElementById("scale").value;
  const chordDegree = parseInt(document.getElementById("chord-degree").value, 10) - 1;
  const chordType = document.getElementById("chord-type").value;
  const scaleScheme = scales[scale];
  const chordScheme = chords[chordType].map(
    (noteDegree) => {
      const targetNote = noteDegree - 1 + chordDegree;
      return scaleScheme[targetNote % scaleScheme.length];
    }
  );
  const result = [];
  for (const octave of octaves) {
    result.push(...notes.map((requiredNote) => {
      return root + 12 * octave + chordScheme[requiredNote % chordScheme.length] + 12 * parseInt(requiredNote / chordScheme.length, 10);
    }));
  }
  return result;
};
