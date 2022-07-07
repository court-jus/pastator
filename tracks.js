export class Tracks {
  constructor(tracks) {
    this.tracks = tracks;
  }

  tick() { for (const track of this.tracks) { track.tick(); } }
  updateNotes() { for (const track of this.tracks) { track.updateNotes(); } }
  startPlay() { for (const track of this.tracks) { track.startPlay(); } }
  pausePlay() { for (const track of this.tracks) { track.pausePlay(); } }
  togglePlay() { for (const track of this.tracks) { track.togglePlay(); } }
  fullStop(panic = false) { for (const track of this.tracks) { track.fullStop(panic); } }
  setDevice(device) { for (const track of this.tracks) { track.setDevice(device); } }

  addNote(channel, note) {
    for (const track of tracks.filter((track) => track.channel === channel)) {
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
}
