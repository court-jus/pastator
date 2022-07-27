import { scales, chords } from "./presets";
import type { SongData } from "@/model/types";

export const getNotes = (song: SongData, notes: number[], octaves: number[], relatedTo: string) => {
  if (relatedTo === "static") {
    // Keep the notes as they are
    return notes.sort();
  }
  const scaleScheme = scales[song.scale];
  const candidateNotes =
    relatedTo === "chord"
      ? chords[song.currentChordType].map((noteDegree: number) => {
        const targetNote = noteDegree - 1 + (song.currentChord - 1);
        return scaleScheme[targetNote % scaleScheme.length];
      })
      : scaleScheme;
  const result = [];
  for (const octave of octaves) {
    result.push(
      ...notes.map((requiredNote) => {
        return (
          song.rootNote +
          12 * octave +
          candidateNotes[requiredNote % candidateNotes.length] +
          12 * Math.trunc(requiredNote / candidateNotes.length)
        );
      })
    );
  }
  return result;
};

export const playNote = (port: MIDIOutput, channel: number, note: number, velocity: number, delay = 0) => {
  if (delay) {
    window.setTimeout(() => {
      playNote(port, channel, note, velocity);
    }, delay);
    return;
  }
  if (note > -1 && note < 128) port.send([0x80 | (1 << 4) | channel, note, velocity]);
};

export const stopNote = (port: MIDIOutput, channel: number, note: number) => {
  if (note > -1 && note < 128) port.send([0x80 | (0 << 4) | channel, note, 64]);
};

export const noteNumberToName = (note: number, showOctave = true): string => {
  // C4 = 60
  const noteName = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][note % 12];
  const octave = Math.trunc(note / 12) - 1;
  return /* note.toString() + ":" + */noteName + (showOctave ? octave.toString(): "");
};


export function isMIDIMessageEvent(event: Event | MIDIMessageEvent): event is MIDIMessageEvent {
  return (event as MIDIMessageEvent).data !== undefined;
};


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
