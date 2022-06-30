"use strict";

import { scales, chords } from "./presets.js";

export const getNotes = (notes, octaves, relatedTo) => {
  if (relatedTo === "static") {
    // Keep the notes as they are
    return notes.sort();
  }
  const root = parseInt(document.getElementById("root-note").value, 10);
  const scale = document.getElementById("scale").value;
  const chordDegree = parseInt(document.getElementById("chord-degree").value, 10) - 1;
  const chordType = document.getElementById("chord-type").value;
  const scaleScheme = scales[scale];
  const candidateNotes =
    relatedTo === "chord"
      ? chords[chordType].map((noteDegree) => {
          const targetNote = noteDegree - 1 + chordDegree;
          return scaleScheme[targetNote % scaleScheme.length];
        })
      : scaleScheme;
  const result = [];
  for (const octave of octaves) {
    result.push(
      ...notes.map((requiredNote) => {
        return (
          root +
          12 * octave +
          candidateNotes[requiredNote % candidateNotes.length] +
          12 * parseInt(requiredNote / candidateNotes.length, 10)
        );
      })
    );
  }
  return result.sort();
};
