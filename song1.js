"use strict";

import { Track, PresetTrack } from "./track.js";

const strum = PresetTrack(0, 55, 100, "pad", "widechord");
strum.strumDelay = 50;

export const tracks = [
  // Drone
  PresetTrack(3, 100, 100, "pad", "drone"),
  // Chords ("pad")
  strum,
  // Bassline
  PresetTrack(2, 55, 65, "bass", "widechord"),
  // Lead
  PresetTrack(1, 60, 45, "lead", "varponderatedscale"),
  // drums
  // 36 = kick
  PresetTrack(10, 50, 30, "drums", "kick13"),
  // 37 = rim
  // 39 = clap
  // 41 = low snare or kick
  // 38 40 43 45 = snare
  PresetTrack(9, 50, 30, "drums", "snare24"),
  // 47 48 50 = tom
  // 46 51 53 = cymbal
  // 54 = tambourin
  // 42 = CH
  PresetTrack(9, 100, 30, "drums", "chhn"),
  // 44 55 = OH
  // 49 57 = crash
  new Track(9, 0, 30, 60, 8, [100, 30, 50, 20], [46]),
  // 59 = ride
  /* */
];
