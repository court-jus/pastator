import { TrackModel } from "./TrackModel";

export class SongModel {
  tracks: TrackModel[];
  rootNote: number;
  scale: string;
  chordProgression: number[];
  currentChord: number;
  currentChordType: string;
  device?: MIDIOutput;

  constructor() {
    this.tracks = [
      new TrackModel(),
      new TrackModel()
    ];
    this.rootNote = 60;
    this.scale = "major";
    this.chordProgression = [];
    this.currentChord = 1;
    this.currentChordType = "triad";
  }


  addTrack(track = undefined) {
    const newTrack = track || new TrackModel();
    // newTrack.applyPreferences(this.preferences);
    this.tracks.push(newTrack);
  }

  removeTrack(track: TrackModel) {
    const trackIndex = this.tracks.indexOf(track);
    this.tracks.splice(trackIndex, 1);
    return trackIndex;
  }
  /*

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
  */
  /*
  addNote(channel: number, note: number) {
    for (const track of this.tracks.filter((track) => track.channel === channel)) {
      track.addNote(note);
    }
  }

  setChord(value: number) {
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
      rootNote: this.rootNote,
      scale: this.scale,
      chord: this.currentChord,
      chordType: this.currentChordType,
      tracks: this.tracks.map(track => track.save())
    };
  }

  new() {
    this.fullStop();
    this.rootNote = 60;
    this.scale = "major";
    this.currentChord = 1;
    this.currentChordType = "seventh";
  }

  load(data) {
    this.new();
    this.rootNote = data.rootNote;
    this.scale = data.scale;
    this.currentChord = data.currentChord;
    this.currentChordType = data.currentChordType;
    this.loadTracks(data.tracks);
  }

  loadTracks(songTracks: TrackModel[]) {
    for (const trackData of songTracks) {
      const track = new TrackModel();
      track.song = this;
      track.load(trackData);
      this.addTrack(track);
    }
  }
  */

}
