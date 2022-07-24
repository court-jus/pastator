"use strict";

import { scales, chords } from "./presets.js";

export const getNotes = (song, notes, octaves, relatedTo) => {
  if (relatedTo === "static") {
    // Keep the notes as they are
    return notes.sort();
  }
  const scaleScheme = scales[song.scale];
  const candidateNotes =
    relatedTo === "chord"
      ? chords[song.chordType].map((noteDegree) => {
          const targetNote = noteDegree - 1 + song.chord;
          return scaleScheme[targetNote % scaleScheme.length];
        })
      : scaleScheme;
  const result = [];
  for (const octave of octaves) {
    result.push(
      ...notes.map((requiredNote) => {
        return (
          song.root +
          12 * octave +
          candidateNotes[requiredNote % candidateNotes.length] +
          12 * parseInt(requiredNote / candidateNotes.length, 10)
        );
      })
    );
  }
  return result.sort();
};
