import { scales, chords } from "./presets";
import type { EuclideanMode, MelotorModel, SongData } from "@/model/types";

export const getNotes = (
  song: SongData,
  notes: number[],
  octaves: number[],
  relatedTo: string
) => {
  if (relatedTo === "static") {
    // Keep the notes as they are
    return notes;
  }
  const scaleScheme = scales[song.scale];
  const candidateNotes =
    relatedTo === "chord" || relatedTo === "invchord"
      ? chords[song.currentChordType].map((noteDegree: number) => {
          const targetNote = noteDegree - 1 + (song.currentChord - 1);
          return (
            scaleScheme[targetNote % scaleScheme.length] +
            (relatedTo === "chord"
              ? 12 * Math.trunc(targetNote / scaleScheme.length)
              : 0)
          );
        })
      : scaleScheme;
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
  force = false
): number[] => {
  if (
    melotor.currentMelo.length > 0 &&
    (position % melotor.meloChangeDiv) !== 0 &&
    !force
  ) {
    return melotor.currentMelo;
  }
  const availableNotes = [0, 1, 2, 3, 4, 5, 6]; // TODO: read that from Song Data
  const ponderatedNotes = availableNotes.reduce(
    (acc: number[], note: number, idx: number): number[] => {
      const proba = melotor.notesProbabilities[idx] || 0;
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
    let indexes = new Array(melotor.meloLength).fill(1).map((_, idx) => idx);
    let howManyToChange = Math.ceil(
      (melotor.meloChangeStrength / 100) * melotor.meloLength
    );
    while (howManyToChange === undefined || howManyToChange > 0) {
      const chosen = indexes[Math.trunc(Math.random() * indexes.length)];
      melo[chosen] =
        ponderatedNotes[Math.trunc(Math.random() * ponderatedNotes.length)];
      howManyToChange -= 1;
      indexes.splice(chosen, 1);
    }
  }
  return melo;
};

export const computeEuclidean = (x: number, y: number | null, density: number, gridSize: number, mode: EuclideanMode): number | null => {
  if (density === 0) return null;
  const newY = y === null ? null : (gridSize - y);
  const newX = x % gridSize;
  const xprev = (newX - 1) % gridSize;
  const new_value = computeEuclideanValue(newX, density, gridSize, mode);
  if (newY !== null && new_value !== newY) return null;
  const prev_value = computeEuclideanValue(xprev, density, gridSize, mode);
  if (prev_value !== new_value) return 0;
  return 1;
};

export const computeEuclideanValue = (x: number, density: number, gridSize: number, mode: EuclideanMode): number => {
  if (mode === "sinus") {
    // x is between 0 and gridSize
    // newX is between 0 and 2*PI and relates to density
    const newX = (x / gridSize * Math.PI * 2) * (64 - density) / 32;
    return Math.floor(((Math.cos(newX) + 1) * gridSize / 8) + gridSize / 6);
  } else if (mode === "dexp") {
    const slope = 1;
    const newX = (x+1) / density * 4.16 / 6;
    const y = Math.floor(Math.exp(newX) * slope);
    return y;
  } else if (mode === "uexp") {
    const slope = 1;
    const newX = (64-x+1) / density * 4.16 / 6;
    const y = Math.floor(Math.exp(newX) * slope);
    return y;
  }
  // Default: linear
  return Math.floor(((x+1) * (64 - density)) / gridSize) + 1;
}

export const playNote = (
  port: MIDIOutput,
  channel: number,
  note: number,
  velocity: number
) => {
  if (note > -1 && note < 128)
    port.send([0x80 | (1 << 4) | channel, note, velocity]);
};

export const stopNote = (port: MIDIOutput, channel: number, note: number) => {
  if (note > -1 && note < 128) {
    port.send([0x80 | (0 << 4) | channel, note, 64])
  };
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

const noteNamesInScale = (songData: SongData): string[] => {
  // Work In Progress
  const result: string[] = [];
  console.log(songData.rootNote, songData.scale, scales[songData.scale]);
  const rootNoteName = noteNames[songData.rootNote % 12];
  const rootNoteBaseName = rootNoteName.slice(0, 1);
  const rootNoteLetterIndex = letters.indexOf(rootNoteBaseName);
  const isRootAltered = rootNoteName.length > 1;
  for (let degree = 0; degree < 7; degree++) {
    const currentDegree = scales[songData.scale][degree];
    const currentLetter = letters[(rootNoteLetterIndex + degree) % letters.length];
    const majorInterval = majorIntervals[degree];
    if (currentDegree === majorInterval) {
      result.push(currentLetter + (isRootAltered ? "#" : ""));
    } else if (currentDegree === majorInterval + 1) {

    }
    console.log(currentLetter, degree, currentDegree, majorInterval);
  }
  return result;
};

export const noteNumberToName = (note: number, songData: SongData, showOctave = true): string => {
  // C4 = 60
  const noteName = noteNames[note % 12];
  const octave = Math.trunc(note / 12) - 1;
  return (
    /* note.toString() + ":" + */ noteName +
    (showOctave ? octave.toString() : "")
  );
};

export function isMIDIMessageEvent(
  event: Event | MIDIMessageEvent
): event is MIDIMessageEvent {
  return (event as MIDIMessageEvent).data !== undefined;
}

export const getMIDIMessage = (message: MIDIMessageEvent) => {
  let type = "";
  let channel: string | number = "";
  let system = null;
  const data = message.data;
  const time = message.timeStamp;

  switch (message.data[0] & 0xf0) {
    case 0x80 | (0 << 4):
      type = "Note Off";
      break;

    case 0x80 | (1 << 4):
      type = "Note On";
      break;

    case 0x80 | (2 << 4):
      type = "Aftertouch";
      break;

    case 0x80 | (3 << 4):
      type = "Control Change";
      break;

    case 0x80 | (4 << 4):
      type = "Program Change";
      break;

    case 0x80 | (5 << 4):
      type = "Aftertouch Channel";
      break;

    case 0x80 | (6 << 4):
      type = "PitchBend";
      break;

    case 0x80 | (7 << 4):
      type = "System";
      system = message.data[0] & 0x0f;
      break;
  }

  if (system != null) {
    switch (system) {
      case 0:
        channel = "Exclusive";
        break;

      case 1:
        channel = "Time";
        break;

      case 2:
        channel = "Song Position";
        break;

      case 3:
        channel = "Song Select";
        break;

      case 6:
        channel = "Tune Request";
        break;

      case 7:
        channel = "Exclusive End";
        break;

      case 8:
        channel = "Clock";
        break;

      case 10:
        channel = "Start";
        break;

      case 11:
        channel = "Continue";
        break;

      case 12:
        channel = "Stop";
        break;

      case 14:
        channel = "Active Sense";
        break;

      case 15:
        channel = "Reset";
        break;
    }
  } else channel = (message.data[0] & 0x0f) + 1;

  return {
    time,
    data,
    channel,
    system,
    type,
  };
};
