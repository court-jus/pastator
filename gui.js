"use strict";
import { clearPreferences, dumpPreferences, handlePrefsFileSelected } from "./prefs.js";
import { presets } from "./presets.js";

export const setUpTrackGui = (track) => {
  const row = document.createElement("tr");

  const playBtn = document.createElement("button");
  playBtn.innerHTML = "P";
  playBtn.onclick = () => {
    track.togglePlay();
  };

  const channelInput = document.createElement("input");
  channelInput.type = "number";
  channelInput.min = 1;
  channelInput.max = 16;

  const divInput = document.createElement("input");
  divInput.type = "number";
  divInput.min = 1;
  divInput.max = 128;

  const gravityCenterInput = document.createElement("input");
  gravityCenterInput.type = "number";
  gravityCenterInput.min = 1;
  gravityCenterInput.max = 128;

  const gravityStrengthInput = document.createElement("input");
  gravityStrengthInput.type = "number";
  gravityStrengthInput.min = 1;
  gravityStrengthInput.max = 128;

  const notesInput = document.createElement("input");
  const playModeInput = document.createElement("select");
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
    playModeInput.appendChild(option);
  }
  const relatedToInput = document.createElement("select");
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
    relatedToInput.appendChild(option);
  }
  const rythmInput = document.createElement("input");

  const volInput = document.createElement("input");
  volInput.type = "number";
  volInput.min = 0;
  volInput.max = 100;

  const categorySelect = document.createElement("select");
  const defaultCategoryOption = document.createElement("option");
  defaultCategoryOption.value = "nil";
  defaultCategoryOption.innerHTML = "---";
  categorySelect.appendChild(defaultCategoryOption);
  for (const presetName of Object.keys(presets)) {
    const option = document.createElement("option");
    option.value = presetName;
    option.innerHTML = presetName;
    categorySelect.appendChild(option);
  }
  const presetSelect = document.createElement("select");
  const defaultPresetOption = document.createElement("option");
  defaultPresetOption.value = "nil";
  defaultPresetOption.innerHTML = "---";
  presetSelect.appendChild(defaultPresetOption);
  categorySelect.onchange = (ev) => {
    for (let i = presetSelect.options.length - 1; i >= 1; i--) {
      presetSelect.remove(i);
    }
    const categoryId = ev.target.value;
    const categoryPresets = presets[categoryId];
    if (categoryPresets) {
      for (const preset of categoryPresets) {
        const option = document.createElement("option");
        option.value = preset.id;
        option.innerHTML = preset.label;
        presetSelect.appendChild(option);
      }
      presetSelect.value =
        track.currentPreset && track.currentPreset.category === categoryId ? track.currentPreset.id : "nil";
      presetSelect.onchange = (ev) => {
        for (const preset of categoryPresets) {
          if (preset.id === ev.target.value) {
            track.setPreset({
              ...preset,
              category: categoryId,
            });
          }
        }
      };
    }
  };
  categorySelect.value = track.currentPreset ? track.currentPreset.category : "nil";
  const evt = new Event("change");
  categorySelect.dispatchEvent(evt);

  for (const item of [
    playBtn,
    channelInput,
    divInput,
    gravityCenterInput,
    gravityStrengthInput,
    notesInput,
    playModeInput,
    relatedToInput,
    rythmInput,
    volInput,
    categorySelect,
    presetSelect,
  ]) {
    const td = document.createElement("td");
    td.appendChild(item);
    row.appendChild(td);
  }
  const tracksContainer = document.getElementById("tracks");
  tracksContainer.appendChild(row);

  track.inputs.channel = channelInput;
  channelInput.onchange = (ev) => {
    track.channel = parseInt(ev.target.value, 10);
    track.refreshDisplay();
  };
  track.inputs.division = divInput;
  divInput.onchange = (ev) => {
    track.division = parseInt(ev.target.value, 10);
    track.refreshDisplay();
  };
  track.inputs.gravityCenter = gravityCenterInput;
  gravityCenterInput.onchange = (ev) => {
    track.gravityCenter = parseInt(ev.target.value, 10);
    track.updateNotes();
  };
  track.inputs.gravityStrength = gravityStrengthInput;
  gravityStrengthInput.onchange = (ev) => {
    track.gravityStrength = parseInt(ev.target.value, 10);
    track.updateNotes();
  };
  track.inputs.notes = notesInput;
  notesInput.onchange = (ev) => {
    track.availableNotes = ev.target.value.split(" ").map((val) => parseInt(val, 10));
    track.refreshDisplay();
  };
  track.inputs.playMode = playModeInput;
  playModeInput.onchange = (ev) => {
    track.playMode = ev.target.value;
    track.refreshDisplay();
  };
  track.inputs.relatedTo = relatedToInput;
  relatedToInput.onchange = (ev) => {
    track.relatedTo = ev.target.value;
    track.updateNotes();
  };
  track.inputs.rythm = rythmInput;
  rythmInput.onchange = (ev) => {
    track.rythmDefinition = ev.target.value.split(" ").map((val) => parseInt(val, 10));
    track.refreshDisplay();
  };
  track.inputs.vol = volInput;
  volInput.onchange = (ev) => {
    track.baseVelocity = parseInt(ev.target.value, 10);
    track.refreshDisplay();
  };
  track.inputs.preset = presetSelect;
  track.inputs.presetCategory = categorySelect;
  track.refreshDisplay();
};

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
};
