"use strict";

import { showEvent } from "./logEvents.js";

// Notification area to show the connection and error messages.
const notify = document.getElementById("notify");

const notesInput = document.getElementById("notes-input");

const addNote = (note, elementId, limit = 8) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.value += " " + note;
  const notes = element.value.split(" ");
  if (notes.length > limit) {
    element.value = notes.slice(notes.length - limit).join(" ");
  }
}

// Log section showing state change messages.
let midi = null;

// Send and receive MIDI notes.
let sendDevice = null;
let receiveDevice = null;

const musicalContext = {
  rootNote: 60,
  baseVelocity: 64,
};

// Disconnect a device and clear the received MIDI message log.
const resetInput = () => {
  if (receiveDevice) {
    receiveDevice.onmidimessage = null;
    receiveDevice.close();
    receiveDevice = null;
  }
};

// Print the properties of a MIDI port.
const printPort = (port, list, withAction = null) => {
  const fields = [
    "id",
    "manufacturer",
    "name",
    "type",
    "version",
    "connection",
    "state",
  ];

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
    if (field == "connection" && port[field] == "open")
      e.style.backgroundColor = "hsl(120, 50%, 85%)";

    row.appendChild(e);
  }

  list.appendChild(row);
};

class Track {
  constructor(channel, transpose, baseVelocity, division, rythmDefinition) {
    this.channel = channel;
    this.transpose = transpose;
    this.baseVelocity = baseVelocity;
    this.division = division;
    this.rythmDefinition = rythmDefinition;
    this.position = 0;
    this.playing = false;
    this.interval = null;
    this.lastNotes = [];
  }

  note() {
    if (!notesInput) return 60;
    const availableNotes = notesInput.value
      .split(" ")
      .map((val) => parseInt(val, 10));
    const chosenNote =
      availableNotes[Math.floor(Math.random() * availableNotes.length)];
    this.lastNotes.push(chosenNote);
    if (this.lastNotes.length >= 5) {
      this.lastNotes.shift();
    }
    return chosenNote + this.transpose;
  }

  rythm() {
    const chosenVelocity = this.rythmDefinition[this.position % this.rythmDefinition.length];
    const restThreshold = 100;
    if (chosenVelocity >= restThreshold) {
      console.log("beat");
      return chosenVelocity * this.baseVelocity;
    }
    const restProbability = chosenVelocity / restThreshold;
    if (Math.random() >= restProbability) return 0;
    return chosenVelocity * this.baseVelocity;
  }
}

const tracks = [
  new Track(parseInt(document.getElementById("channel").value, 10) - 1, 12, 0.65, 250, [100, 50, 80, 50]),
  new Track(1, 0, 0.7, 125, [100, 25, 50, 60, 80, 35, 40, 70, 90, 45, 70, 20, 85, 25, 35, 30])
];


const play = () => {
  if (!sendDevice) return;
  for (let track of tracks) {
    if (track.playing) {
      window.clearInterval(track.interval);
      track.playing = false;
    } else {
      track.interval = window.setInterval(() => {
        const note = track.note();
        const velocity = track.rythm();
        if (velocity > 0) {
          playNote(
            sendDevice,
            track.channel,
            note,
            velocity,
            track.division - 10
          );
        }
        track.position += 1;
      }, track.division);
      track.playing = true;
    }
  }
};

const playNote = (port, channel, note, velocity, duration) => {
  /* To send MIDI cc, use:
        const channel = document.getElementById('sendControlChannel').value - 1;
        const number = document.getElementById('sendControlNumber').value;
        const value = document.getElementById('sendControlValue').value;
        sendDevice.send([0x80 | (3 << 4) | channel, number, value]);
      */
  port.send([0x80 | (1 << 4) | channel, note, velocity]);

  window.setTimeout(() => {
    sendDevice.send([0x80 | (0 << 4) | channel, note, 64]);
  }, duration);
};

// Update the list of ports.
const updateOutput = (doPlay = false) => {
  const output = document.getElementById("output");

  if (sendDevice && sendDevice.state == "disconnected") sendDevice = null;

  while (output.firstChild) output.firstChild.remove();

  for (const port of midi.outputs.values()) {
    const midiOutCallback = (port) => {
      if (sendDevice && sendDevice.id !== port.id) {
        sendDevice.close();
      } else if (!sendDevice) {
        sendDevice = port;
        if (sendDevice) sendDevice.open();
      }
      if (sendDevice !== null) {
        play(); // Note(sendDevice, channel, note, velocity, 1000);
      }
    };
    if (
      (port.id ===
        "6FB73D1DB8F9B18CAF942CFDFEEE36D6181DA17A243E5F69FA52717D79ABA625" ||
        port.id === "3oswrdB/m2nfnht/pH8UKoqoTB/9TXbp/Fc5CfmxrzA=") &&
      doPlay
    ) {
      midiOutCallback(port);
    }
    printPort(port, output, midiOutCallback);
  }
};

const updateInput = (doPlay = false) => {
  const input = document.getElementById("input");

  if (receiveDevice && receiveDevice.state == "disconnected") resetInput();

  while (input.firstChild) input.firstChild.remove();

  for (const port of midi.inputs.values()) {
    const inputCallback = (port) => {
      resetInput();

      if (!port) return;

      receiveDevice = port;
      port.onmidimessage = (message) => {
        const m = getMIDIMessage(message);
        if (m.type == "System" && m.channel == "Clock") {
          console.log("tick");
        } else if (m.type === "Note On") {
          for (const track of tracks.filter((track) => track.channel === m.channel - 1)) {
            addNote(m.data[1], "notes-input", 13);
          }
        } else if (m.type === "Note Off") {
          // pass
        } else {
          console.log(m);
        }
      };
    };
    if (
      (port.id ===
        "eXNR1/GHU/qmukRRdYDlpwkSKWmFPBL7iTsTvR+ehYM=" && doPlay)
    ) {
      console.log("bind to input", port);
      inputCallback(port);
    }
    printPort(port, input, inputCallback);
  }
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

const connectSystem = () => {
  navigator
    .requestMIDIAccess({
      sysex: true,
    })
    .then(
      (access) => {
        notify.innerText = "Connected";
        notify.style.backgroundColor = "hsl(120, 50%, 85%)";
        midi = access;

        midi.onstatechange = (event) => {
          showEvent(event);
          updateInput();
          updateOutput();
        };

        resetInput();

        updateInput(true);
        updateOutput(true);
      },
      (error) => {
        notify.innerHTML =
          "Unable to access MIDI devices: <i>" + error + "</i>";
        notify.style.backgroundColor = "hsl(0, 50%, 85%)";
      }
    );
};

console.log("Starting up...");
if (navigator.requestMIDIAccess) {
  console.log("Requesting MIDI Access");
  connectSystem();
} else {
  console.error("No WebMIDI support found");
  notify.innerText = "No WebMIDI support found";
  notify.style.backgroundColor = "hsl(0, 50%, 85%)";
}
