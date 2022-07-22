import { Track } from "./track.js";
export class Song {
  constructor(preferences) {
    this.preferences = preferences;
    this.device = null;
    this.tracks = [];
    this.root = null;
    this.scale = null;
    this.chord = null;
    this.chordType = null;
  }

  addTrack(track = undefined) {
    const newTrack = track || new Track();
    newTrack.song = this;
    newTrack.applyPreferences(this.preferences);
    newTrack.setDevice(this.device);
    this.tracks.push(newTrack);
  }

  removeTrack(track) {
    const trackIndex = this.tracks.indexOf(track);
    this.tracks.splice(trackIndex, 1);
    return trackIndex;
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
    this.device = device;
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

  refreshDisplay() {
    document.getElementById("root-note").value = this.root;
    document.getElementById("scale").value = this.scale;
    document.getElementById("chord-degree").value = this.chord;
    document.getElementById("chord-type").value = this.chordType;
  }

  save() {
    return {
      root: this.root,
      scale: this.scale,
      chord: this.chord,
      chordType: this.chordType,
      tracks: this.tracks.map(track => track.save())
    };
  }

  new() {
    this.fullStop();
    this.root = 60;
    this.scale = "major";
    this.chord = 1;
    this.chordType = "seventh";
    for(const track of [...this.tracks]) {
      track.gui.deleteTrack();
    }
    this.refreshDisplay();
  }

  load(data) {
    this.new();
    this.root = data.root;
    this.scale = data.scale;
    this.chord = data.chord;
    this.chordType = data.chordType;
    this.loadTracks(data.tracks);
    this.refreshDisplay();
  }

  loadTracks(songTracks) {
    for (const trackData of songTracks) {
      const track = new Track();
      track.song = this;
      track.load(trackData);
      this.addTrack(track);
    }
  }

}
