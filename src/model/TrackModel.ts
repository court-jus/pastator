import type { SongModel } from "./SongModel";


const playNote = (port: MIDIOutput, channel: number, note: number, velocity: number, delay = 0) => {
  if (delay) {
    window.setTimeout(() => {
      playNote(port, channel, note, velocity);
    }, delay);
    return;
  }
  if (note > -1 && note < 128) port.send([0x80 | (1 << 4) | channel, note, velocity]);
};

const stopNote = (port: MIDIOutput, channel: number, note: number) => {
  if (note > -1 && note < 128) port.send([0x80 | (0 << 4) | channel, note, 64]);
};

export class TrackModel {
  id: number;
  channel?: number;
  division?: number;
  gravityCenter?: number;
  gravityStrength?: number;
  currentNotes?: number[];
  gate?: number;
  transpose?: number;
  baseVelocity?: number;
  strumDelay?: number;
  rythmDefinition?: number[];
  position?: number;
  playing?: boolean;
  timeout?: number;
  lastNotes?: number[];
  availableNotes?: number[];
  maxNotes?: number;
  playMode?: string;
  relatedTo?: string;
  device?: MIDIOutput;

  constructor(id: number) {
    this.id = id;
  }


  setDevice(device:MIDIOutput) {
    this.device = device;
  }

}

