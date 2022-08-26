import type { CallBacks, ChordType, Scale } from "./types";
import { BarLength } from "./presets";
import type { LoadableTrackModel, SavedTrackModel } from "./TrackModel";
import { TrackModel } from "./TrackModel";
import { download } from "../utils";
import { getMIDIMessage, isMIDIMessageEvent } from "../backends/webmidibackend";

export type Architecture = "front" | "back" | "clientserver";

export class SongModel {
    rootNote: number
    scale: Scale
    barLength: number
    currentChord: number
    currentChordType: ChordType
    chordProgression: number[]
    tracks: Record<string, TrackModel>
    callbacks?: CallBacks
    position: number
    tracksPlaying: boolean
    seqPlaying: boolean
    clock: number
    architecture: Architecture

  constructor(architecture: Architecture, callbacks?: CallBacks) {
    this.architecture = architecture;
    this.rootNote = 60;
    this.scale = "major";
    this.barLength = BarLength;
    this.currentChord = 1;
    this.currentChordType = "triad";
    this.chordProgression = [1, 4, 6, 5];
    this.tracks = {}
    this.callbacks = callbacks;
    this.position = 0;
    this.tracksPlaying = false;
    this.seqPlaying = false;
    this.clock = 0;
  }

  // Load/Save/...
  load(data: LoadableSongModel) {
    this.apply(data);
    if (this.architecture === "clientserver" || this.architecture === "back") {
      this.callbacks?.remoteMessage("setSong", this.save());
    }
  }
  apply(data: LoadableSongModel) {
    const { tracks, ...songData } = data;
    Object.assign(this, songData);
    if (tracks !== undefined) {
      if (Object.keys(tracks).length === 0) {
        for (const [trackId, track] of Object.entries(this.tracks)) {
          track.fullStop(true);
          delete this.tracks[trackId];
        }
      }
      for (const [trackId, trackData] of Object.entries(tracks)) {
        if (this.tracks[trackId]) {
          this.tracks[trackId].apply(trackData);
        } else {
          const newTrack = new TrackModel(this);
          newTrack.id = trackId;
          newTrack.apply(trackData);
          this.tracks[trackId] = newTrack;
        }
      }
    }
  }
  save(): SavedSongModel {
    const { architecture, callbacks, ...dataToSave } = this;
    return {
      ...dataToSave,
      tracks: Object.entries(this.tracks).reduce((acc: Record<string, SavedTrackModel>, curr: [string, TrackModel]) => {
        const [ trackId, track ] = curr;
        return {
          ...acc,
          [trackId]: track.save()
        }
      }, {} as Record<string, SavedTrackModel>)
    };
  }

  tick() {
    const oldClock = this.clock;
    this.clock += 1;
    if (this.clock % this.barLength === 0) {
      this.position = Math.trunc(this.clock / this.barLength);
      const changes: LoadableSongModel = {
        position: this.position
      };
      if (this.seqPlaying) {
        const previousChord = this.currentChord;
        this.currentChord = this.chordProgression[this.position % this.chordProgression.length];
        if (this.currentChord !== previousChord) {
          changes.currentChord = this.currentChord;
        }
      }
      if (this.architecture === "clientserver" || this.architecture === "back") {
        this.callbacks?.remoteMessage("setSong", changes);
      }
  }
    for (const track of Object.values(this.tracks)) {
      track.tick(oldClock)
    }
  }
  addTrack(track?: TrackModel) {
    const newTrack = track ? track : new TrackModel(this);
    this.tracks[newTrack.id] = newTrack;
    if (this.architecture === "clientserver" || this.architecture === "back") {
      this.callbacks?.remoteMessage("setSong", this.save());
    }
  }
  removeTrack(trackId: string) {
    this.tracks[trackId].fullStop(true);
    delete this.tracks[trackId];
    if (this.architecture === "clientserver" || this.architecture === "back") {
      this.callbacks?.remoteMessage("setSong", this.save());
    }
  }
  playpause(seq = true, tracks = true) {
    if (seq) {
      this.seqPlaying = !this.seqPlaying;
      if (this.architecture === "clientserver" || this.architecture === "back") {
        this.callbacks?.remoteMessage("setSong", { seqPlaying: this.seqPlaying });
      }
    }
    if (tracks) {
      this.tracksPlaying = !this.tracksPlaying;
      if (this.architecture === "clientserver" || this.architecture === "back") {
        this.callbacks?.remoteMessage("setSong", { tracksPlaying: this.tracksPlaying });
      }
      for (const track of Object.values(this.tracks)) {
        if (this.tracksPlaying) {
          track.play();
        } else {
          track.fullStop();
        }
      }
    }
  }
  stop(seq = true, tracks = true) {
    if (seq && this.seqPlaying) {
      this.seqPlaying = false;
      if (this.architecture === "clientserver" || this.architecture === "back") {
        this.callbacks?.remoteMessage("setSong", { seqPlaying: this.seqPlaying });
      }
    }
    if (tracks && this.tracksPlaying) {
      this.tracksPlaying = false;
      if (this.architecture === "clientserver" || this.architecture === "back") {
        this.callbacks?.remoteMessage("setSong", { tracksPlaying: this.tracksPlaying });
      }
      for (const track of Object.values(this.tracks)) {
        track.fullStop();
        track.rew();
      }
    }
    this.rewind();
  }
  rewind() {
    const targetPosition = 0;
    const targetChord = this.chordProgression[targetPosition % this.chordProgression.length];
    const changed = (this.position !== targetPosition || this.currentChord !== targetChord);
    this.position = targetPosition;
    this.currentChord = targetChord;
    if (changed && (this.architecture === "clientserver" || this.architecture === "back")) {
      this.callbacks?.remoteMessage("setSong", {
        position: this.position,
        currentChord: this.currentChord
      });
    }
    for (const track of Object.values(this.tracks)) {
      track.rew();
    }
  }
  panic() {
    this.stop();
    for (const track of Object.values(this.tracks)) {
      track.fullStop(true);
      track.rew();
    }
  }
  loadFile(evt: Event) {
    this.newProject();
    const files = (evt.target as HTMLInputElement).files;
    if (files === null) return;
    const f = files[0];
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        const loadedSongData = JSON.parse(reader.result) as SavedSongModel;
        this.load(loadedSongData);
      }
    });
    reader.readAsText(f);
  }
  newProject() {
    for (const [trackId, track] of Object.entries(this.tracks)) {
      track.fullStop(true);
      delete this.tracks[trackId];
    }
    if (this.architecture === "clientserver" || this.architecture === "back") {
      this.callbacks?.remoteMessage("setSong", this.save());
    }
  }
  saveFile(fileName?: string) {
    const dataToSave: SavedSongModel = this.save();
    const json = JSON.stringify(dataToSave, undefined, 2);
    const filename = fileName ? (
      fileName.toLowerCase().endsWith(".json") ? fileName : fileName + ".json"
    ) : "pastasong.json";
    download(filename, json);
  }
  setupCCDevice(newDevice: MIDIInput) {
    newDevice.addEventListener("midimessage", (message) => {
      if (isMIDIMessageEvent(message)) {
        const m = getMIDIMessage(message);
        if (m.type === "Control Change") {
          const [, cc, val] = Array.from(m.data);
          let trackIndex = 0;
          for (const [, track] of Object.entries(this.tracks)) {
            if (trackIndex === m.channel as number - 1) {
              track.receiveCC(cc, val);
            }
            trackIndex++;
          }
        }
      }
    });
  }
};


export type SavedSongModel = Pick<SongModel, 
  "rootNote" |
  "scale" |
  "barLength" |
  "currentChord" |
  "currentChordType" |
  "chordProgression" |
  "clock" |
  "seqPlaying" |
  "tracksPlaying" |
  "position"
> & {
    tracks: Record<string, SavedTrackModel | LoadableTrackModel>
};

export type LoadableSongModel = Partial<SavedSongModel>;
