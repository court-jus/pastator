"use strict";

import { Track, PresetTrack } from "./track.js";
import { presets } from "./presets.js";

export const tracks = [
    // Bassline
    PresetTrack(0, 60, presets.bass[1]),
    // Lead
    new Track(
      1,
      0,
      0,
      12,
      [100, 25, 50, 60, 80, 35, 40, 70, 90, 45, 70, 20, 85, 25, 35, 30],
      [60, 60, 60, 63, 65, 67, 67, 68, 70, 72]
    ),
    /*
    new Track(2, 0, 0, 125, [100, 25, 50, 60, 80, 35, 40, 70, 90, 45, 70, 20, 85, 25, 35, 30], [60, 48]),
    // drums
    */
    // 36 = kick
    new Track(9, 0, 0, 6, [100, 0, 0, 0], [36]),
    // 37 = rim
    // 39 = clap
    // 41 = low snare or kick
    // 38 40 43 45 = snare
    new Track(9, 0, 0, 6, [0, 0, 100, 0, 0, 0, 0, 100], [38]),
    // 47 48 50 = tom
    // 46 51 53 = cymbal
    // 54 = tambourin
    // 42 = CH
    // new Track(9, 0, 40, 6, [80, 65, 70, 65, 80, 55, 90, 60, 85, 50, 50, 75, 80, 35, 70, 65], [42]),
    new Track(9, 0, 0, 6, [100], [42]),
    // 44 55 = OH
    // 49 57 = crash
    // new Track(9, 0, 40, 24, [100, 0, 0, 0], [39]),
    // 59 = ride
  ];
  