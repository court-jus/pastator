import { setChord } from "./gui.js";

const sequencerInput = document.getElementById("chord-sequence");

class Sequencer {
  constructor() {
    this.position = 0;
    this.progression = [1, 1, 4, 6, 3, 5];
  }

  tick() {
    console.log("sequencer tick");
    if (window.masterClock % 48 === 0) {
      setChord(this.progression[this.position % this.progression.length]);
      this.position += 1;
    }
  }
}

export const sequencer = new Sequencer();
