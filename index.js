"use strict";

import { showEvent } from "./logEvents.js";

// Notification area to show the connection and error messages.
const notify = document.getElementById("notify");

const notesInput = document.getElementById("notes-input");

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

const tracks_1 = [
  {
    notes: [48, 48, 48, 48],
    rythm: [100, 0, 0, 60],
    baseVelocity: 1,
    channel: 3,
    interval: null,
    division: 250,
    playing: false,
    position: 0,
  },
  {
    notes: [48, 51, 43, 48, 51, 55, 48],
    rythm: [100, 90, 100, 95, 101, 94],
    baseVelocity: 1,
    channel: 1,
    interval: null,
    division: 1000,
    playing: false,
    position: 0,
  },
  {
    notes: [51, 43, 48, 51, 55, 48],
    rythm: [100, 90, 100, 95, 101, 94],
    baseVelocity: 0.8,
    channel: 15,
    interval: null,
    division: 1500,
    playing: false,
    position: 0,
  },
  {
    notes: [48, 48, 51, 43, 48, 51, 55, 48],
    rythm: [100, 90, 100, 95, 94],
    baseVelocity: 0.8,
    channel: 14,
    interval: null,
    division: 750,
    playing: false,
    position: 0,
  },
  {
    notes: [60, 63, 60, 67, 62, 60, 63, 68, 70, 60, 65],
    rythm: [80, 60, 55, 30, 45],
    baseVelocity: 0.8,
    channel: 0,
    interval: null,
    division: 250,
    playing: false,
    position: 0,
  },
  {
    notes: [60, 60, 67, 72, 55],
    rythm: [100, 60, 100, 30, 60, 70, 80, 50, 95],
    baseVelocity: 0.65,
    channel: 2,
    interval: null,
    division: 125,
    playing: false,
    position: 0,
  },
];

class Track {
  constructor(channel, baseVelocity, division) {
    this.channel = channel;
    this.baseVelocity = baseVelocity;
    this.division = division;
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
    return chosenNote;
  }

  rythm() {
    const restProbability = 0.3;
    if (Math.random() < restProbability) return 0;
    const rythms = [
      [100, 60, 100, 30, 60, 70, 80, 50, 95],
      [80, 60, 55, 30, 45],
    ];
    const chosenRythm = rythms[Math.floor(Math.random() * rythms.length)];
    const chosenVelocity =
      chosenRythm[this.position % chosenRythm.length] * this.baseVelocity;
    return chosenVelocity;
  }
}

const tracks = [new Track(2, 0.65, 250)];

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
      port.id ===
        "6FB73D1DB8F9B18CAF942CFDFEEE36D6181DA17A243E5F69FA52717D79ABA625" &&
      doPlay
    ) {
      midiOutCallback(port);
    }
    printPort(port, output, midiOutCallback);
  }
};

const updateInput = () => {
  const input = document.getElementById("input");

  if (receiveDevice && receiveDevice.state == "disconnected") resetInput();

  while (input.firstChild) input.firstChild.remove();

  for (const port of midi.inputs.values()) {
    const clockCallback = (port) => {
      console.log("Not implemented");
      return;
      resetInput();

      if (!port) return;

      receiveDevice = port;
      port.onmidimessage = (message) => {
        const m = getMIDIMessage(message);
        if (m.type == "System" && m.channel == "Clock") {
          console.log("tick");
        } else {
          console.log(m);
        }
      };
    };
    printPort(port, input, clockCallback);
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

        updateInput();
        resetInput();

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
