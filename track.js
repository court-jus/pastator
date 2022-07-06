"use strict";

import { getNotes } from "./engine.js";
import { presets } from "./presets.js";

const baseDivision = 12; // 1 beat

const playNote = (port, channel, note, velocity, delay = 0) => {
  if (delay) {
    window.setTimeout(() => {
      playNote(port, channel, note, velocity);
    }, delay);
    return;
  }
  port.send([0x80 | (1 << 4) | channel, note, velocity]);
};

const stopNote = (port, channel, note) => {
  port.send([0x80 | (0 << 4) | channel, note, 64]);
};

export class Track {
  constructor(channel, transpose, gate, baseVelocity, division, rythmDefinition, notesAvailable) {
    this.device = null;
    this.channel = channel;
    this.currentNote = [];
    this.gate = gate;
    this.transpose = transpose;
    this.baseVelocity = baseVelocity;
    this.division = division;
    this.strumDelay = 0;
    this.rythmDefinition = rythmDefinition;
    this.position = 0;
    this.playing = false;
    this.timeout = null;
    this.lastNotes = [];
    this.availableNotes = notesAvailable;
    this.maxNotes = 7;
    this.currentPreset = null;
    this.playMode = "nil";
    this.relatedTo = "nil";
    this.inputs = {
      channel: null,
      division: null,
      notes: null,
      playMode: null,
      relatedTo: null,
      rythm: null,
      vol: null,
      presetCategory: null,
      preset: null,
    };
  }

  refreshDisplay() {
    if (this.inputs.channel) this.inputs.channel.value = this.channel;
    if (this.inputs.division) this.inputs.division.value = this.division;
    if (this.inputs.notes) this.inputs.notes.value = this.availableNotes.join(" ");
    if (this.inputs.playMode) this.inputs.playMode.value = this.playMode;
    if (this.inputs.relatedTo) this.inputs.relatedTo.value = this.relatedTo;
    if (this.inputs.rythm) this.inputs.rythm.value = this.rythmDefinition.join(" ");
    if (this.inputs.vol) this.inputs.vol.value = this.baseVelocity;
    if (this.inputs.presetCategory) {
      this.inputs.presetCategory.value = this.currentPreset ? this.currentPreset.category : "nil";
      const evt = new Event("change");
      this.inputs.presetCategory.dispatchEvent(evt);
    }
    if (this.inputs.preset) this.inputs.preset.value = this.currentPreset ? this.currentPreset.id : "nil";
  }

  addNote(note) {
    this.availableNotes.push(note);
    if (this.availableNotes.length > this.maxNotes) {
      this.availableNotes = this.availableNotes.slice(this.availableNotes.length - this.maxNotes);
    }
    this.refreshDisplay();
  }

  setPreset(preset) {
    this.currentPreset = preset;
    this.rythmDefinition = preset.rythm;
    this.division = preset.division * baseDivision;
    this.playMode = preset.playMode;
    this.relatedTo = preset.relatedTo;
    this.updateNotes();
  }

  updateNotes() {
    if (this.currentPreset) {
      this.availableNotes = getNotes(this.currentPreset.notes, this.currentPreset.octaves, this.relatedTo);
      this.refreshDisplay();
    }
  }

  setDevice(device) {
    this.device = device;
    this.startPlay();
  }

  note() {
    const chosenNote =
      this.playMode === "random"
        ? this.availableNotes[Math.floor(Math.random() * this.availableNotes.length)]
        : this.playMode === "up"
        ? this.availableNotes[this.position % this.availableNotes.length]
        : this.availableNotes[0];
    this.lastNotes.push(chosenNote);
    if (this.lastNotes.length >= 5) {
      this.lastNotes.shift();
    }
    return chosenNote + this.transpose;
  }

  rythm() {
    const chosenVelocity = this.rythmDefinition[this.position % this.rythmDefinition.length];
    const restThreshold = 100;
    if (chosenVelocity >= restThreshold) {
      return (chosenVelocity * this.baseVelocity) / 100;
    }
    const restProbability = chosenVelocity / restThreshold;
    if (Math.random() >= restProbability) return 0;
    return (chosenVelocity * this.baseVelocity) / 100;
  }

  play() {
    if (this.device === null) return;
    const playedNotes = this.playMode === "atonce" ? this.availableNotes : [this.note()];
    const velocity = this.rythm();
    if (velocity > 0) {
      let strumDelay = 0;
      for (const note of playedNotes) {
        this.currentNote.push(note);
        playNote(this.device, this.channel, note, velocity, strumDelay);
        strumDelay += this.strumDelay;
      }
    }
    this.position += 1;
  }

  stop() {
    if (this.device === null) return;
    if (this.currentNote.length === 0) return;
    for (const currentNote of this.currentNote) {
      stopNote(this.device, this.channel, currentNote);
    }
    this.currentNote = [];
  }

  startPlay() {
    this.playing = true;
  }

  pausePlay() {
    this.playing = false;
  }

  fullStop(panic=false) {
    if (panic) this.stop();
    this.playing = false;
    this.position = 0;
  }

  tick() {
    if (!this.playing) return;
    if (window.masterClock % this.division === 0) {
      if (this.gate === 100) this.stop();
      this.play();
    } else if (this.gate < 100) {
      const pcLow = ((window.masterClock % this.division) / this.division) * 100;
      const pcHigh = (((window.masterClock + 1) % this.division) / this.division) * 100;
      if (pcLow < this.gate && pcHigh >= this.gate) {
        this.stop();
      }
    }
  }
}

export const PresetTrack = (channel, baseVelocity, gate, categoryId, presetId) => {
  const preset = presets[categoryId].filter((value) => value.id === presetId)[0];
  const track = new Track(
    channel,
    0,
    gate,
    baseVelocity,
    preset.division * baseDivision,
    preset.rythm,
    getNotes(preset.notes, preset.octaves, preset.relatedTo)
  );
  track.setPreset({
    ...preset,
    category: categoryId,
  });
  return track;
};
