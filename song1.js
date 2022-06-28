"use strict";

import { Track, PresetTrack } from "./track.js";

export const tracks = [
  // Bassline
  PresetTrack(0, 65, "bass", "widechord"),
  // Lead
  PresetTrack(1, 60, "lead", "varponderatedscale"),
  // drums
  // 36 = kick
  new Track(9, 0, 100, 6, [100, 0, 0, 0], [36]),
  // 37 = rim
  // 39 = clap
  // 41 = low snare or kick
  // 38 40 43 45 = snare
  new Track(9, 0, 100, 6, [0, 0, 100, 0, 0, 0, 0, 100], [38]),
  // 47 48 50 = tom
  // 46 51 53 = cymbal
  // 54 = tambourin
  // 42 = CH
  // new Track(9, 0, 40, 6, [80, 65, 70, 65, 80, 55, 90, 60, 85, 50, 50, 75, 80, 35, 70, 65], [42]),
  new Track(9, 0, 100, 6, [80, 65, 70, 65, 80, 55, 90, 60, 85, 50, 50, 75, 80, 35, 70, 65], [42]),
  // 44 55 = OH
  // 49 57 = crash
  new Track(9, 0, 100, 8, [100, 30, 50, 20], [46]),
  // 59 = ride
];
