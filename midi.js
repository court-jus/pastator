"use strict";

import { showEvent } from "./logEvents.js";
import { savePreferences } from "./prefs.js";

// Print the properties of a MIDI port.
const printPort = (port, list, withAction = null) => {
  const fields = ["id", "manufacturer", "name", "type", "version", "connection", "state"];

  const row = document.createElement("tr");
  if (withAction) {
    const btn_td = document.createElement("td");
    const btn = document.createElement("button");
    btn.onclick = () => {
      withAction(port);
    };
    btn_td.appendChild(btn);
    row.appendChild(btn_td);
  }

  for (const field of fields) {
    const e = document.createElement("td");

    e.innerText = port[field];
    if (field == "connection" && port[field] == "open") e.style.backgroundColor = "hsl(120, 50%, 85%)";

    row.appendChild(e);
  }

  list.appendChild(row);
};

const getMIDIMessage = (message) => {
  let type = "";
  let channel = "";
  let system = null;
  const data = message.data;
  const time = message.timeStamp;

  switch (message.data[0] & 0xf0) {
    case 0x80 | (0 << 4):
      type = "Note Off";
      break;

    case 0x80 | (1 << 4):
      type = "Note On";
      break;

    case 0x80 | (2 << 4):
      type = "Aftertouch";
      break;

    case 0x80 | (3 << 4):
      type = "Control Change";
      break;

    case 0x80 | (4 << 4):
      type = "Program Change";
      break;

    case 0x80 | (5 << 4):
      type = "Aftertouch Channel";
      break;

    case 0x80 | (6 << 4):
      type = "PitchBend";
      break;

    case 0x80 | (7 << 4):
      type = "System";
      system = message.data[0] & 0x0f;
      break;
  }

  if (system != null) {
    switch (system) {
      case 0:
        channel = "Exclusive";
        break;

      case 1:
        channel = "Time";
        break;

      case 2:
        channel = "Song Position";
        break;

      case 3:
        channel = "Song Select";
        break;

      case 6:
        channel = "Tune Request";
        break;

      case 7:
        channel = "Exclusive End";
        break;

      case 8:
        channel = "Clock";
        break;

      case 10:
        channel = "Start";
        break;

      case 11:
        channel = "Continue";
        break;

      case 12:
        channel = "Stop";
        break;

      case 14:
        channel = "Active Sense";
        break;

      case 15:
        channel = "Reset";
        break;
    }
  } else channel = (message.data[0] & 0x0f) + 1;

  return {
    time,
    data,
    channel,
    system,
    type,
  };
};

// Disconnect a device and clear the received MIDI message log.
const resetInput = () => {
  if (window.receiveDevice) {
    window.receiveDevice.onmidimessage = null;
    window.receiveDevice.close();
    window.receiveDevice = null;
  }
};

// Update the list of ports.
const updateOutput = (preferences, doPlay = false, song) => {
  const output = document.getElementById("output");

  if (sendDevice && sendDevice.state == "disconnected") sendDevice = null;

  while (output.firstChild) output.firstChild.remove();

  for (const port of window.midi.outputs.values()) {
    const midiOutCallback = (port) => {
      if (sendDevice && sendDevice.id !== port.id) {
        sendDevice.close();
      } else if (!sendDevice) {
        sendDevice = port;
        if (sendDevice) sendDevice.open();
        song.setDevice(sendDevice);
      }
      savePreferences(preferences);
    };
    if (port.id === preferences.midiOut && doPlay) {
      midiOutCallback(port);
    }
    printPort(port, output, midiOutCallback);
  }
};

const updateInput = (preferences, doPlay = false, song, sequencer = null) => {
  const input = document.getElementById("input");

  if (window.receiveDevice && window.receiveDevice.state == "disconnected") resetInput();

  while (input.firstChild) input.firstChild.remove();

  for (const port of window.midi.inputs.values()) {
    const inputCallback = (port) => {
      resetInput();

      if (!port) return;

      window.receiveDevice = port;
      savePreferences(preferences);
      port.onmidimessage = (message) => {
        const m = getMIDIMessage(message);
        if (m.type === "System" && m.channel === "Stop") {
          window.masterClock = 0;
          song.fullStop();
        } else if (m.type === "System" && m.channel === "Clock") {
          if (window.masterClock % 24 === 0) {
            const led = document.getElementById("clock-led");
            if (led.className.indexOf("red") === -1) {
              led.className = "led red-led";
            } else {
              led.className = "led green-led";
            }
          }
          song.tick();
          if (sequencer) sequencer.tick();
          window.masterClock += 1;
        } else if (m.type === "Note On") {
          song.addNote(m.channel - 1, m.data[1]);
        } else if (m.type === "Note Off") {
          // pass
        }
      };
    };
    if (port.id === preferences.midiIn && doPlay) {
      inputCallback(port);
    }
    printPort(port, input, inputCallback);
  }
};

export const connectSystem = (preferences, sequencer) => {
  const song = sequencer.song;
  navigator
    .requestMIDIAccess({
      sysex: true,
    })
    .then(
      (access) => {
        notify.innerText = "Connected";
        notify.style.backgroundColor = "hsl(120, 50%, 85%)";
        window.midi = access;

        window.midi.onstatechange = (event) => {
          showEvent(event);
          updateInput(preferences, false, song);
          updateOutput(preferences, false, song);
        };

        resetInput();

        updateInput(preferences, true, song, sequencer);
        updateOutput(preferences, true, song);
      },
      (error) => {
        notify.innerHTML = "Unable to access MIDI devices: <i>" + error + "</i>";
        notify.style.backgroundColor = "hsl(0, 50%, 85%)";
      }
    );
};
