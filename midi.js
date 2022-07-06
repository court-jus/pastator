"use strict";

import { showEvent } from "./logEvents.js";

// const favoriteMidiOut = "SH9i9CHH4tcApsEdzLIZbcyjZylnEMXYbysOsbIaeKY=";
// const favoriteMidiOut = "lxicVCpkG7/gBf3veX6RVSWQPhV1parZ+R7ToYgcOYM=";
const favoriteMidiOut = "BA8A5FFA99BA4618BEFB70459B91B957F64E2025650886F0A212156C0B0C3271";
// const favoriteMidiIn = "eXNR1/GHU/qmukRRdYDlpwkSKWmFPBL7iTsTvR+ehYM=";
// const favoriteMidiIn = "3oswrdB/m2nfnht/pH8UKoqoTB/9TXbp/Fc5CfmxrzA=";
const favoriteMidiIn = "09C5322899595E883634448B79CC5A957D62738A17CF1A251142220CCD40BA05";

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
const updateOutput = (doPlay = false, tracks) => {
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
        for (const track of tracks) {
          track.setDevice(sendDevice);
        }
      }
    };
    if (port.id === favoriteMidiOut && doPlay) {
      midiOutCallback(port);
    }
    printPort(port, output, midiOutCallback);
  }
};

const updateInput = (doPlay = false, tracks, sequencer = null) => {
  const input = document.getElementById("input");

  if (window.receiveDevice && window.receiveDevice.state == "disconnected") resetInput();

  while (input.firstChild) input.firstChild.remove();

  for (const port of window.midi.inputs.values()) {
    const inputCallback = (port) => {
      resetInput();

      if (!port) return;

      window.receiveDevice = port;
      port.onmidimessage = (message) => {
        const m = getMIDIMessage(message);
        if (m.type === "System" && m.channel === "Stop") {
          window.masterClock = 0;
          for (const track of tracks) {
            track.position = 0;
          }
        } else if (m.type === "System" && m.channel === "Clock") {
          if (window.masterClock % 24 === 0) {
            const led = document.getElementById("clock-led");
            if (led.className.indexOf("red") === -1) {
              led.className = "led red-led";
            } else {
              led.className = "led green-led";
            }
          }
          for (const track of tracks) {
            track.tick();
          }
          if (sequencer) sequencer.tick();
          window.masterClock += 1;
        } else if (m.type === "Note On") {
          console.debug(m);
          for (const track of tracks.filter((track) => track.channel === m.channel - 1)) {
            track.addNote(m.data[1]);
          }
        } else if (m.type === "Note Off") {
          // pass
        } else {
          console.debug(m);
        }
      };
    };
    if (port.id === favoriteMidiIn && doPlay) {
      inputCallback(port);
    }
    printPort(port, input, inputCallback);
  }
};

export const connectSystem = (tracks, sequencer) => {
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
          updateInput(false, tracks);
          updateOutput(false, tracks);
        };

        resetInput();

        updateInput(true, tracks, sequencer);
        updateOutput(true, tracks);
      },
      (error) => {
        notify.innerHTML = "Unable to access MIDI devices: <i>" + error + "</i>";
        notify.style.backgroundColor = "hsl(0, 50%, 85%)";
      }
    );
};
