"use strict";
import { clearPreferences, dumpPreferences, handlePrefsFileSelected } from "./prefs.js";
import { presets } from "./presets.js";
import { download } from "./utils.js";

const tracksContainer = document.getElementById("tracks");

export class TrackGui {
  constructor(track) {
    this.track = track;
    this.trackContainer = document.createElement("tr");

    this.playBtn = document.createElement("button");
    this.playBtn.onclick = () => {
      this.track.togglePlay();
    };

    this.channelInput = document.createElement("input");
    this.channelInput.type = "number";
    this.channelInput.min = 1;
    this.channelInput.max = 16;
    this.channelInput.onchange = (ev) => {
      this.track.setChannel(parseInt(ev.target.value, 10));
    };

    this.divInput = document.createElement("input");
    this.divInput.type = "number";
    this.divInput.min = 1;
    this.divInput.max = 128;
    this.divInput.onchange = (ev) => {
      this.track.division = parseInt(ev.target.value, 10);
      this.refreshDisplay();
    };

    this.gravityCenterInput = document.createElement("input");
    this.gravityCenterInput.type = "number";
    this.gravityCenterInput.min = 1;
    this.gravityCenterInput.max = 128;
    this.gravityCenterInput.onchange = (ev) => {
      this.track.gravityCenter = parseInt(ev.target.value, 10);
      this.track.updateNotes();
    };

    this.gravityStrengthInput = document.createElement("input");
    this.gravityStrengthInput.type = "number";
    this.gravityStrengthInput.min = 1;
    this.gravityStrengthInput.max = 128;
    this.gravityStrengthInput.onchange = (ev) => {
      this.track.gravityStrength = parseInt(ev.target.value, 10);
      this.track.updateNotes();
    };

    this.notesInput = document.createElement("input");
    this.notesInput.onchange = (ev) => {
      this.track.availableNotes = ev.target.value.split(" ").map((val) => parseInt(val, 10));
      this.refreshDisplay();
    };
    this.playModeInput = document.createElement("select");
    for (const playMode of [
      {
        id: "nil",
        label: "---",
      },
      {
        id: "up",
        label: "up",
      },
      {
        id: "random",
        label: "random",
      },
      {
        id: "atonce",
        label: "All at once",
      },
    ]) {
      const option = document.createElement("option");
      option.value = playMode.id;
      option.innerHTML = playMode.label;
      this.playModeInput.appendChild(option);
    }
    this.playModeInput.onchange = (ev) => {
      this.track.playMode = ev.target.value;
      this.refreshDisplay();
    };

    this.relatedToInput = document.createElement("select");
    for (const relatedTo of [
      {
        id: "nil",
        label: "---",
      },
      {
        id: "scale",
        label: "scale",
      },
      {
        id: "chord",
        label: "chord",
      },
      {
        id: "static",
        label: "static",
      },
    ]) {
      const option = document.createElement("option");
      option.value = relatedTo.id;
      option.innerHTML = relatedTo.label;
      this.relatedToInput.appendChild(option);
    }
    this.relatedToInput.onchange = (ev) => {
      this.track.relatedTo = ev.target.value;
      this.track.updateNotes();
    };

    this.rythmInput = document.createElement("input");
    this.rythmInput.onchange = (ev) => {
      this.track.rythmDefinition = ev.target.value.split(" ").map((val) => parseInt(val, 10));
      this.refreshDisplay();
    };

    this.volInput = document.createElement("input");
    this.volInput.type = "number";
    this.volInput.min = 0;
    this.volInput.max = 100;
    this.volInput.onchange = (ev) => {
      this.track.baseVelocity = parseInt(ev.target.value, 10);
      this.refreshDisplay();
    };

    this.categorySelect = document.createElement("select");
    const defaultCategoryOption = document.createElement("option");
    defaultCategoryOption.value = "nil";
    defaultCategoryOption.innerHTML = "---";
    this.categorySelect.appendChild(defaultCategoryOption);
    for (const categoryName of Object.keys(presets)) {
      const option = document.createElement("option");
      option.value = categoryName;
      option.innerHTML = categoryName;
      this.categorySelect.appendChild(option);
    }
    this.presetSelect = document.createElement("select");
    const defaultPresetOption = document.createElement("option");
    defaultPresetOption.value = "nil";
    defaultPresetOption.innerHTML = "---";
    this.presetSelect.appendChild(defaultPresetOption);
    this.categorySelect.onchange = (ev) => {
      for (let i = this.presetSelect.options.length - 1; i >= 1; i--) {
        this.presetSelect.remove(i);
      }
      const categoryId = ev.target.value;
      const categoryPresets = presets[categoryId];
      if (categoryPresets) {
        for (const preset of categoryPresets) {
          const option = document.createElement("option");
          option.value = preset.id;
          option.innerHTML = preset.label;
          this.presetSelect.appendChild(option);
        }
        this.presetSelect.value =
          this.track.currentPreset && this.track.currentPreset.category === categoryId ? this.track.currentPreset.id : "nil";
        this.presetSelect.onchange = (ev) => {
          for (const preset of categoryPresets) {
            if (preset.id === ev.target.value) {
              this.track.setPreset({
                ...preset,
                category: categoryId,
              });
            }
          }
        };
      }
    };

    this.delBtn = document.createElement("button");
    this.delBtn.innerHTML = "X";
    this.delBtn.onclick = () => this.deleteTrack();

    for (const item of [
      this.playBtn,
      this.channelInput,
      this.divInput,
      this.gravityCenterInput,
      this.gravityStrengthInput,
      this.notesInput,
      this.playModeInput,
      this.relatedToInput,
      this.rythmInput,
      this.volInput,
      this.categorySelect,
      this.presetSelect,
      this.delBtn,
    ]) {
      const td = document.createElement("td");
      td.appendChild(item);
      this.trackContainer.appendChild(td);
    }

    tracksContainer.appendChild(this.trackContainer);
    this.refreshDisplay();
  }

  deleteTrack() {
    const trackIndex = this.track.delete();
    tracksContainer.removeChild(
      tracksContainer.children[trackIndex]
    );
  }

  refreshDisplay() {
    this.playBtn.innerHTML = this.track.playing ? "P" : "S";
    if (this.channelInput !== document.activeElement) this.channelInput.value = this.track.channel;
    if (this.divInput !== document.activeElement) this.divInput.value = this.track.division;
    if (this.gravityCenterInput !== document.activeElement) this.gravityCenterInput.value = this.track.gravityCenter;
    if (this.gravityStrengthInput !== document.activeElement) this.gravityStrengthInput.value = this.track.gravityStrength;
    if (this.notesInput !== document.activeElement) this.notesInput.value = this.track.availableNotes.join(" ");
    if (this.playModeInput !== document.activeElement) this.playModeInput.value = this.track.playMode;
    if (this.relatedToInput !== document.activeElement) this.relatedToInput.value = this.track.relatedTo;
    if (this.rythmInput !== document.activeElement) this.rythmInput.value = this.track.rythmDefinition.join(" ");
    if (this.volInput !== document.activeElement) this.volInput.value = this.track.baseVelocity;
    this.categorySelect.value = this.track.currentPreset ? this.track.currentPreset.category : "nil";
    const evt = new Event("change");
    this.categorySelect.dispatchEvent(evt);
  }
}


export const setUpMainControls = (sequencer) => {
  const song = sequencer.song;
  song.updateNotes();
  const root = document.getElementById("root-note");
  const scale = document.getElementById("scale");
  const chordDegree = document.getElementById("chord-degree");
  const chordType = document.getElementById("chord-type");
  for (const widget of [root, scale, chordDegree, chordType]) {
    widget.onchange = () => {
      song.updateNotes();
    };
  }
  for (const button of document.getElementsByClassName("chord-degree")) {
    if (button.innerHTML === chordDegree.value) {
      button.className = "chord-degree active";
    }
    button.onclick = () => {
      song.setChord(button.innerHTML);
    };
  }

  document.getElementById("seqplay-btn").onclick = () => {
    sequencer.startPlay();
  };

  document.getElementById("seqpause-btn").onclick = () => {
    sequencer.pausePlay();
  };

  document.getElementById("seqstop-btn").onclick = () => {
    sequencer.stop();
  };
  document.getElementById("play-btn").onclick = () => {
    sequencer.startPlay();
    song.startPlay();
  };

  document.getElementById("pause-btn").onclick = () => {
    sequencer.pausePlay();
    song.pausePlay();
  };

  document.getElementById("stop-btn").onclick = () => {
    sequencer.stop();
    song.fullStop();
  };
  document.getElementById("panic-btn").onclick = () => {
    sequencer.stop();
    song.fullStop(true);
  };

  document.getElementById("dump-prefs-btn").onclick = () => {
    dumpPreferences();
  };
  document.getElementById("clear-prefs-btn").onclick = () => {
    clearPreferences();
  };
  document.getElementById("prefs-file-input").addEventListener("change", handlePrefsFileSelected, false);
  document.getElementById("addtrack-btn").onclick = () => {
    song.addTrack();
  };
  document.getElementById("savesong-btn").onclick = () => {
    const data = song.save();
    download("song.json", JSON.stringify(data, undefined, 2));
  }
  document.getElementById("newsong-btn").onclick = () => {
    song.new();
  }

  const handleSongFileSelected = (evt) => {
    const files = evt.target.files;
    const f = files[0];
    const reader = new FileReader();

    reader.onload = (() => {
      return (e) => {
        song.load(JSON.parse(e.target.result));
      };
    })(f);

    reader.readAsText(f);
  };
  document.getElementById("song-file-input").addEventListener("change", handleSongFileSelected, false);
};
