"use strict";
import { presets } from "./presets.js";


export const setUpTracksTable = (tracks) => {
  const tracksContainer = document.getElementById("tracks");

  for (const track of tracks) {
    const row = document.createElement("tr");

    const channelInput = document.createElement("input");
    channelInput.type = "number";
    channelInput.min = 1;
    channelInput.max = 16;

    const divInput = document.createElement("input");
    divInput.type = "number";
    divInput.min = 1;
    divInput.max = 128;

    const notesInput = document.createElement("input");
    const rythmInput = document.createElement("input");

    const volInput = document.createElement("input");
    volInput.type = "number";
    volInput.min = 0;
    volInput.max = 100;

    const categorySelect = document.createElement("select");
    for (const presetName of Object.keys(presets)) {
      const option = document.createElement("option");
      option.value = presetName;
      option.innerHTML = presetName;
      categorySelect.appendChild(option);
    }
    const presetSelect = document.createElement("select");
    const option = document.createElement("option");
    option.value = "nil";
    option.innerHTML = "---";
    presetSelect.appendChild(option);
    categorySelect.onchange = (ev) => {
      for (let i = presetSelect.options.length - 1; i >= 1; i--) {
        presetSelect.remove(i);
      }
      const categoryPresets = presets[ev.target.value];
      for (const preset of categoryPresets) {
        const option = document.createElement("option");
        option.value = preset.id;
        option.innerHTML = preset.label;
        presetSelect.appendChild(option);
      }
      presetSelect.onchange = (ev) => {
        for (const preset of categoryPresets) {
          if (preset.id === ev.target.value) {
            track.setPreset(preset);
          }
        }
      };
    };

    for (const item of [
      channelInput,
      divInput,
      notesInput,
      rythmInput,
      volInput,
      categorySelect,
      presetSelect,
    ]) {
      const td = document.createElement("td");
      td.appendChild(item);
      row.appendChild(td);
    }
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
    track.inputs.notes = notesInput;
    notesInput.onchange = (ev) => {
      track.availableNotes = ev.target.value
        .split(" ")
        .map((val) => parseInt(val, 10));
      track.refreshDisplay();
    };
    track.inputs.rythm = rythmInput;
    rythmInput.onchange = (ev) => {
      track.rythmDefinition = ev.target.value
        .split(" ")
        .map((val) => parseInt(val, 10));
      track.refreshDisplay();
    };
    track.inputs.vol = volInput;
    volInput.onchange = (ev) => {
      track.baseVelocity = parseInt(ev.target.value, 10);
      track.refreshDisplay();
    };
    track.inputs.preset = presetSelect;
    track.refreshDisplay();
  }

};

export const setUpMainControls = (tracks) => {
  const root = document.getElementById("root-note");
  const scale = document.getElementById("scale");
  const chordDegree = document.getElementById("chord-degree");
  const chordType = document.getElementById("chord-type");
  for (const widget of [root, scale, chordDegree, chordType]) {
    widget.onchange = () => {
      for(const track of tracks) {
        track.updateNotes();
      }
    };
  }
  for (const button of document.getElementsByClassName("chord-degree")) {
    button.onclick = () => {
      chordDegree.value = button.innerHTML;
      chordDegree.onchange();
    }
  }
};
