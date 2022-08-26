import type { Output, Note, Channel } from "easymidi";

const easymidiPlayNote = (
  port: Output,
  channel: number,
  note: number,
  velocity: number
) => {
  const noteEvt: Note = {
    channel: channel as Channel,
    note: note,
    velocity: velocity
  }
  if (note > -1 && note < 128) {
    port.send("noteon", noteEvt);
  }
};

const easymidiStopNote = (port: Output, channel: number, note: number) => {
  const noteEvt: Note = {
    channel: channel as Channel,
    note: note,
    velocity: 0
  }
  if (note > -1 && note < 128) {
    port.send("noteoff", noteEvt);
  };
};

export const playNote = (
  port: Output
) => (channel: number, note: number, velocity: number) => {
  easymidiPlayNote(port, channel, note, velocity);
};

export const stopNote = (port: Output) => (channel: number, note: number) => {
  easymidiStopNote(port, channel, note);
};
