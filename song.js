export class Song {
  constructor(preferences, tracks) {
    this.preferences = preferences;
    this.tracks = tracks;
    this.root = null;
    this.scale = null;
    this.chord = null;
    this.chordType = null;
    for (const track of this.tracks) {
      track.song = this;
      track.applyPreferences(preferences);
    }
  }

  getValuesFromGui() {
    this.root = parseInt(document.getElementById("root-note").value, 10);
    this.scale = document.getElementById("scale").value;
    this.chord = parseInt(document.getElementById("chord-degree").value, 10) - 1;
    this.chordType = document.getElementById("chord-type").value;
  }

  tick() {
    for (const track of this.tracks) {
      track.tick();
    }
  }
  updateNotes() {
    this.getValuesFromGui();
    for (const track of this.tracks) {
      track.updateNotes();
    }
  }
  startPlay() {
    for (const track of this.tracks) {
      track.startPlay();
    }
  }
  pausePlay() {
    for (const track of this.tracks) {
      track.pausePlay();
    }
  }
  togglePlay() {
    for (const track of this.tracks) {
      track.togglePlay();
    }
  }
  fullStop(panic = false) {
    for (const track of this.tracks) {
      track.fullStop(panic);
    }
  }
  setDevice(device) {
    for (const track of this.tracks) {
      track.setDevice(device);
    }
  }

  addNote(channel, note) {
    for (const track of this.tracks.filter((track) => track.channel === channel)) {
      track.addNote(note);
    }
  }

  setChord(value) {
    const chordDegree = document.getElementById("chord-degree");
    chordDegree.value = value;
    chordDegree.dispatchEvent(new Event("change"));
    for (const otherbutton of document.getElementsByClassName("chord-degree")) {
      otherbutton.className = "chord-degree";
      if (otherbutton.innerHTML === value.toString()) {
        otherbutton.className = "chord-degree active";
      }
    }
    for (const track of this.tracks) {
      if (track.division === 0) {
        track.applyChord();
      }
    }
  }

  save() {
    return {
      root: this.root,
      scale: this.scale,
      chord: this.chord,
      chordType: this.chordType,
    };
  }
}
