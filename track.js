"use strict";

import { getNotes } from "./engine.js";
import { presets } from "./presets.js";

const baseDivision = 96; // 1 bar

const playNote = (port, channel, note, velocity, duration) => {
  port.send([0x80 | (1 << 4) | channel, note, velocity]);

  window.setTimeout(() => {
    port.send([0x80 | (0 << 4) | channel, note, 64]);
  }, duration);
};


export class Track {
  constructor(
    channel,
    transpose,
    baseVelocity,
    division,
    rythmDefinition,
    notesAvailable
  ) {
    this.device = null;
    this.channel = channel;
    this.transpose = transpose;
    this.baseVelocity = baseVelocity;
    this.division = division;
    this.rythmDefinition = rythmDefinition;
    this.position = 0;
    this.playing = false;
    this.timeout = null;
    this.lastNotes = [];
    this.availableNotes = notesAvailable;
    this.maxNotes = 7;
    this.currentPreset = null;
    this.inputs = {
      channel: null,
      division: null,
      notes: null,
      rythm: null,
      vol: null,
      presetCategory: null,
      preset: null,
    };
  }

  refreshDisplay() {
    if (this.inputs.channel) this.inputs.channel.value = this.channel;
    if (this.inputs.division) this.inputs.division.value = this.division;
    if (this.inputs.notes)
      this.inputs.notes.value = this.availableNotes.join(" ");
    if (this.inputs.rythm)
      this.inputs.rythm.value = this.rythmDefinition.join(" ");
    if (this.inputs.vol) this.inputs.vol.value = this.baseVelocity;
  }

  addNote(note) {
    this.availableNotes.push(note);
    if (this.availableNotes.length > this.maxNotes) {
      this.availableNotes = this.availableNotes.slice(
        this.availableNotes.length - this.maxNotes
      );
    }
    this.refreshDisplay();
  }

  setPreset(preset) {
    this.currentPreset = preset;
    this.rythmDefinition = preset.rythm;
    this.division = preset.division * baseDivision;
    this.updateNotes();
  }

  updateNotes() {
    if (this.currentPreset) {
      this.availableNotes = getNotes(this.currentPreset.notes, this.currentPreset.octaves);
      this.refreshDisplay();
    }
  }

  setDevice(device) {
    this.device = device;
    this.playing = true;
  }

  note() {
    /*
    const availableNotes = this.notesInput.value
      .split(" ")
      .map((val) => parseInt(val, 10));
      */
    const chosenNote =
      this.availableNotes[
      Math.floor(Math.random() * this.availableNotes.length)
      ];
    this.lastNotes.push(chosenNote);
    if (this.lastNotes.length >= 5) {
      this.lastNotes.shift();
    }
    return chosenNote + this.transpose;
  }

  rythm() {
    const chosenVelocity =
      this.rythmDefinition[this.position % this.rythmDefinition.length];
    const restThreshold = 100;
    if (chosenVelocity >= restThreshold) {
      return (chosenVelocity * this.baseVelocity) / 100;
    }
    const restProbability = chosenVelocity / restThreshold;
    if (Math.random() >= restProbability) return 0;
    return (chosenVelocity * this.baseVelocity) / 100;
  }

  play() {
    const note = this.note();
    const velocity = this.rythm();
    if (velocity > 0 && this.device !== null) {
      playNote(this.device, this.channel, note, velocity, 250);
    }
    this.position += 1;
  }

  tick() {
    if (!this.playing) return;
    if (window.masterClock % this.division === 0) {
      this.play();
    }
  }
}

export const PresetTrack = (channel, baseVelocity, preset) => {
  const track = new Track(
    channel,
    0,
    baseVelocity,
    preset.division * baseDivision,
    preset.rythm,
    getNotes(preset.notes, preset.octaves)
  );
  track.currentPreset = preset;
  return track;
}