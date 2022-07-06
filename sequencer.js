const sequencerInput = document.getElementById("chord-sequence");

export class Sequencer {
  constructor(tracks) {
    this.tracks = tracks;
    this.position = 0;
    this.playing = true;
    this.progression = [1, 1, 4, 6, 3, 5];
    this.inputs = {
      progression: sequencerInput
    };
    this.setupGui();
    this.refreshDisplay();
  }

  startPlay() {
    this.playing = true;
    this.setCurrentChord();
  }

  pausePlay() {
    this.playing = false;
  }

  stop() {
    this.playing = false;
    this.position = 0;
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

  setCurrentChord() {
    const newChord = this.progression[this.position % this.progression.length]
    if (newChord) {
      this.tracks.setChord(newChord);
    }
  }

  tick() {
    if (!this.playing) return;
    if (window.masterClock % 96 === 0 && this.progression.length > 0) {
      this.setCurrentChord();
      this.position += 1;
    }
  }
}
