import { scales, chords } from "./presets";
import { SongModel } from "./SongModel";
import type {
  ChordType,
  EuclideanMode,
  MelostepModel,
  MelotorModel,
  Scale,
} from "./types";

const getCandidateNotes = (
  relatedTo: string,
  scale: Scale,
  chordType: ChordType,
  chord: number
) => {
  const scaleScheme = scales[scale];
  return relatedTo === "chord" || relatedTo === "invchord"
    ? chords[chordType].map((noteDegree: number) => {
        const targetNote = noteDegree - 1 + (chord - 1);
        return (
          scaleScheme[targetNote % scaleScheme.length] +
          (relatedTo === "chord"
            ? 12 * Math.trunc(targetNote / scaleScheme.length)
            : 0)
        );
      })
    : scaleScheme;
};

export const getNotes = (
  song: SongModel,
  notes: number[],
  octaves: number[],
  relatedTo: string
) => {
  if (relatedTo === "static") {
    // Keep the notes as they are
    return notes;
  }
  const candidateNotes = getCandidateNotes(
    relatedTo,
    song.scale,
    song.currentChordType,
    song.currentChord
  );
  const result = [];
  for (const octave of octaves) {
    result.push(
      ...notes
        .map((requiredNote) => {
          // We consider that a chord will never contain more than 10 notes
          // so if the requiredNote is 10 or more, that's an octave above
          const rotated = requiredNote % 10;
          const octaveShift = Math.trunc(requiredNote / 10);
          if (candidateNotes.length <= rotated) return 0;
          return (
            song.rootNote +
            12 * (octave + octaveShift) +
            candidateNotes[rotated % candidateNotes.length] +
            12 * Math.trunc(rotated / candidateNotes.length)
          );
        })
        .filter((value) => value > 0)
    );
  }
  return relatedTo === "invchord" ? result.sort() : result;
};

export const computeMelotor = (
  melotor: MelotorModel,
  position: number,
  baseDivision: number,
  songData: SongModel
): number[] | undefined => {
  if (
    melotor.currentMelo.length > 0 &&
    position % (melotor.meloChangeDiv / baseDivision) !== 0
  ) {
    return;
  }
  const chordNotes = chords[songData.currentChordType].map(
    (val) => (val - 1 + songData.currentChord - 1) % 7
  );
  const availableNotes = [0, 1, 2, 3, 4, 5, 6]; // TODO: read that from Song Data
  const indexedProbabilities = availableNotes.reduce(
    (
      acc: Record<number, number>,
      note: number,
      idx: number
    ): Record<number, number> => {
      const isInChord = chordNotes.indexOf(note) >= 0 ? 1 : 0;
      const proba = Math.trunc(
        ((melotor.notesProbabilities[idx] || 0) / 100) *
          (100 - melotor.chordInfluence) +
          isInChord * melotor.chordInfluence
      );
      return { ...acc, [note]: proba };
    },
    {}
  );
  const ponderatedNotes = availableNotes.reduce(
    (acc: number[], note: number): number[] => {
      const proba = indexedProbabilities[note];
      const copied = new Array(proba).fill(note);
      return [...acc, ...copied];
    },
    []
  );
  if (ponderatedNotes.length === 0) {
    ponderatedNotes.push(0);
  }
  const melo = [...melotor.currentMelo.slice(0, melotor.meloLength)];
  if (melo.length < melotor.meloLength) {
    while (melo.length < melotor.meloLength) {
      const idx = Math.trunc(Math.random() * ponderatedNotes.length);
      const candidate = ponderatedNotes[idx];
      melo.push(candidate);
    }
  } else {
    let changeCandidates = melotor.currentMelo.reduce(
      (acc: number[], note: number, idx: number): number[] => {
        return [
          ...acc,
          ...new Array(Math.max(100 - indexedProbabilities[note], 1)).fill(idx),
        ];
      },
      []
    );
    let howManyToChange = Math.ceil(
      (melotor.meloChangeStrength / 100) * melotor.meloLength
    );
    while (howManyToChange === undefined || howManyToChange > 0) {
      const randomIdx = Math.trunc(Math.random() * changeCandidates.length);
      const chosenIdx = changeCandidates[randomIdx];
      melo[chosenIdx] =
        ponderatedNotes[Math.trunc(Math.random() * ponderatedNotes.length)];
      changeCandidates = changeCandidates.filter((val) => val !== chosenIdx);
      howManyToChange -= 1;
    }
  }
  return melo;
};

export const computeMelostep = (
  melostep: MelostepModel,
  position: number,
  division: number,
  song: SongModel
): number[] => {
  const result = Array.from(melostep.input).reduce(
    (acc: number[], curr: string, idx: number, arr: string[]): number[] => {
      if (curr === "*" || acc.length === 0) acc.push(0);
      const prevIdx = idx === 0 ? arr.length - 1 : idx - 1;
      const prevVal = acc.slice(-1)[0];
      if (curr === " " || curr === "_") acc.push(prevVal);
      if (curr === "u") acc.push(prevVal + 1);
      if (curr === "d")
        acc.push((prevVal - 1) % (scales[song.scale].length - 1));
      if (curr === "U") acc.push(prevVal + 2);
      if (curr === "D")
        acc.push((prevVal - 2) % (scales[song.scale].length - 1));
      console.log("i", prevIdx, "v", prevVal, acc);
      return acc;
    },
    []
  );
  console.log(result);
  return result;
};

export const computeEuclidean = (
  x: number,
  y: number | null,
  density: number,
  gridSize: number,
  mode: EuclideanMode
): number | null => {
  if (density === 0) return null;
  const newY = y === null ? null : gridSize - y;
  const newX = x % gridSize;
  const xprev = (newX - 1) % gridSize;
  const new_value = computeEuclideanValue(newX, density, gridSize, mode);
  if (newY !== null && new_value !== newY) return null;
  const prev_value = computeEuclideanValue(xprev, density, gridSize, mode);
  if (prev_value !== new_value) return 0;
  return 1;
};

export const computeEuclideanValue = (
  x: number,
  density: number,
  gridSize: number,
  mode: EuclideanMode
): number => {
  if (mode === "sinus") {
    // x is between 0 and gridSize
    // newX is between 0 and 2*PI and relates to density
    const newX = ((x / gridSize) * Math.PI * 2 * (64 - density)) / 32;
    return Math.floor(((Math.cos(newX) + 1) * gridSize) / 8 + gridSize / 6);
  } else if (mode === "dexp") {
    const slope = 1;
    const newX = (((x + 1) / density) * 4.16) / 6;
    const y = Math.floor(Math.exp(newX) * slope);
    return y;
  } else if (mode === "uexp") {
    const slope = 1;
    const newX = (((64 - x + 1) / density) * 4.16) / 6;
    const y = Math.floor(Math.exp(newX) * slope);
    return y;
  }
  // Default: linear
  return Math.floor(((x + 1) * (64 - density)) / gridSize) + 1;
};

const noteNames = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const letters = "ABCDEFG";
const majorIntervals = scales["major"];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noteNamesInScale = (songData: SongModel): string[] => {
  // Work In Progress
  const result: string[] = [];
  console.log(songData.rootNote, songData.scale, scales[songData.scale]);
  const rootNoteName = noteNames[songData.rootNote % 12];
  const rootNoteBaseName = rootNoteName.slice(0, 1);
  const rootNoteLetterIndex = letters.indexOf(rootNoteBaseName);
  const isRootAltered = rootNoteName.length > 1;
  for (let degree = 0; degree < 7; degree++) {
    const currentDegree = scales[songData.scale][degree];
    const currentLetter =
      letters[(rootNoteLetterIndex + degree) % letters.length];
    const majorInterval = majorIntervals[degree];
    if (currentDegree === majorInterval) {
      result.push(currentLetter + (isRootAltered ? "#" : ""));
    } else if (currentDegree === majorInterval + 1) {
      // not implemented
    }
    console.log(currentLetter, degree, currentDegree, majorInterval);
  }
  return result;
};

export const noteNumberToName = (
  note: number,
  _songData: SongModel,
  showOctave = true
): string => {
  // C4 = 60
  const noteName = noteNames[note % 12];
  const octave = Math.trunc(note / 12) - 1;
  return (
    /* note.toString() + ":" + */ noteName +
    (showOctave ? octave.toString() : "")
  );
};
