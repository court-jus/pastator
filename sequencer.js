import { setChord } from "./gui.js";

const sequencerInput = document.getElementById("chord-sequence");

class Sequencer {
  constructor() {
    this.position = 0;
    this.progression = [1, 1, 4, 6, 3, 5];
    this.inputs = {
      progression: sequencerInput
    };
    this.setupGui();
    this.refreshDisplay();
  }

  setupGui() {
    if (this.inputs.progression) {
      this.inputs.progression.onchange = () => {
        this.progression = this.inputs.progression.value.split(" ").map((val) => parseInt(val, 10));
      };
    }
  }

  refreshDisplay() {
    if (this.inputs.progression) this.inputs.progression.value = this.progression.join(" ");
  }

  tick() {
    if (window.masterClock % 96 === 0 && this.progression.length > 0) {
      const newChord = this.progression[this.position % this.progression.length]
      if (newChord) {
        setChord(newChord);
      }
      this.position += 1;
    }
  }
}

export const sequencer = new Sequencer();
