"use strict";

import { showEvent } from "./logEvents.js";

// const favoriteMidiOut = "SH9i9CHH4tcApsEdzLIZbcyjZylnEMXYbysOsbIaeKY=";
const favoriteMidiOut = "lxicVCpkG7/gBf3veX6RVSWQPhV1parZ+R7ToYgcOYM=";
// const favoriteMidiIn = "eXNR1/GHU/qmukRRdYDlpwkSKWmFPBL7iTsTvR+ehYM=";
const favoriteMidiIn = "3oswrdB/m2nfnht/pH8UKoqoTB/9TXbp/Fc5CfmxrzA=";

// Notification area to show the connection and error messages.
const notify = document.getElementById("notify");
const tracksContainer = document.getElementById("tracks");

// Log section showing state change messages.
let midi = null;

// Send and receive MIDI notes.
let sendDevice = null;
let receiveDevice = null;
let masterClock = 0;

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
  constructor(channel, transpose, baseVelocity, division, rythmDefinition, notesAvailable) {
    this.channel = channel;
    this.transpose = transpose;
    this.baseVelocity = baseVelocity;
    this.division = division;
    this.rythmDefinition = rythmDefinition;
    this.position = 0;
    this.playing = true;
    this.timeout = null;
    this.lastNotes = [];
    this.availableNotes = notesAvailable;
    this.maxNotes = 7;
    this.inputs = {
      channel: null,
      division: null,
      notes: null,
      rythm: null,
      vol: null
    };
  }

  refreshDisplay() {
    if (this.inputs.channel) this.inputs.channel.value = this.channel;
    if (this.inputs.division) this.inputs.division.value = this.division;
    if (this.inputs.notes) this.inputs.notes.value = this.availableNotes.join(" ");
    if (this.inputs.rythm) this.inputs.rythm.value = this.rythmDefinition.join(" ");
    if (this.inputs.vol) this.inputs.vol.value = this.baseVelocity;
  }

  addNote(note) {
    this.availableNotes.push(note);
    if (this.availableNotes.length > this.maxNotes) {
      this.availableNotes = this.availableNotes.slice(this.availableNotes.length - this.maxNotes);
    }
    this.refreshDisplay();
  }

  note() {
    /*
    const availableNotes = this.notesInput.value
      .split(" ")
      .map((val) => parseInt(val, 10));
      */
    const chosenNote =
      this.availableNotes[Math.floor(Math.random() * this.availableNotes.length)];
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
      return chosenVelocity * this.baseVelocity / 100;
    }
    const restProbability = chosenVelocity / restThreshold;
    if (Math.random() >= restProbability) return 0;
    return chosenVelocity * this.baseVelocity / 100;
  }

  play() {
    const note = this.note();
    const velocity = this.rythm();
    if (velocity > 0) {
      playNote(
        sendDevice,
        this.channel,
        note,
        velocity,
        250
      );
    }
    this.position += 1;
  }

  tick() {
    if (!this.playing) return;
    if (masterClock % this.division === 0) {
      this.play();
    }
  }
}

const tracks = [
  // Bassline
  new Track(0, 0, 100, 6, [100, 25, 50, 60, 80, 35, 40, 70, 90, 45, 70, 20, 85, 25, 35, 30],
    [36, 36, 36, 36, 43, 43, 48]),
  // Lead
  new Track(1, 0, 80, 12, [100, 25, 50, 60, 80, 35, 40, 70, 90, 45, 70, 20, 85, 25, 35, 30],
    [60, 60, 60, 63, 65, 67, 67, 68, 70, 72]),
    /*
  new Track(2, 0, 0, 125, [100, 25, 50, 60, 80, 35, 40, 70, 90, 45, 70, 20, 85, 25, 35, 30], [60, 48]),
  // drums
  */
  // 36 = kick
  new Track(9, 0, 55, 6, [100, 0, 0, 0], [36]),
  // 37 = rim
  // 39 = clap
  // 41 = low snare or kick
  // 38 40 43 45 = snare
  new Track(9, 0, 50, 6, [0, 0, 100, 0, 0, 0, 0, 100], [38]),
  // 47 48 50 = tom
  // 46 51 53 = cymbal
  // 54 = tambourin
  // 42 = CH
  // new Track(9, 0, 40, 6, [80, 65, 70, 65, 80, 55, 90, 60, 85, 50, 50, 75, 80, 35, 70, 65], [42]),
  new Track(9, 0, 30, 6, [100], [42]),
  // 44 55 = OH
  // 49 57 = crash
  // new Track(9, 0, 40, 24, [100, 0, 0, 0], [39]),
  // 59 = ride
];

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

  for (const item of [channelInput, divInput, notesInput, rythmInput, volInput]) {
    const td = document.createElement("td");
    td.appendChild(item);
    row.appendChild(td);
  }
  tracksContainer.appendChild(row);

  track.inputs.channel = channelInput;
  channelInput.onchange = (ev) => {
    track.channel = parseInt(ev.target.value, 10);
    track.refreshDisplay();
  }
  track.inputs.division = divInput;
  divInput.onchange = (ev) => {
    track.division = parseInt(ev.target.value, 10);
    track.refreshDisplay();
  }
  track.inputs.notes = notesInput;
  notesInput.onchange = (ev) => {
    track.availableNotes = ev.target.value.split(" ").map((val) => parseInt(val, 10));
    track.refreshDisplay();
  }
  track.inputs.rythm = rythmInput;
  rythmInput.onchange = (ev) => {
    track.rythmDefinition = ev.target.value.split(" ").map((val) => parseInt(val, 10));
    track.refreshDisplay();
  }
  track.inputs.vol = volInput;
  volInput.onchange = (ev) => {
    track.baseVelocity = parseInt(ev.target.value, 10);
    track.refreshDisplay();
  };
  track.refreshDisplay();
}

/*
const play = () => {
  if (!sendDevice) return;
  for (let track of tracks) {
    if (track.playing) {
      window.clearTimeout(track.timeout);
      track.playing = false;
    } else {
      track.timeout = window.setTimeout(() => { track.play() }, track.division);
      track.playing = true;
    }
  }
};
*/

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
        console.log(sendDevice);
      }
      /*
      if (sendDevice !== null) {
        play(); // Note(sendDevice, channel, note, velocity, 1000);
      }
      */
    };
    if (
      port.id === favoriteMidiOut &&
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
        if (m.type === "System" && m.channel === "Stop") {
          masterClock = 0;
          for (const track of tracks) {
            track.position = 0;
          }
        } else if (m.type === "System" && m.channel === "Clock") {
          if (masterClock % 2 === 0) {
            for (const track of tracks) {
              track.tick();
            }
          }
          masterClock += 1;
        } else if (m.type === "Note On") {
          console.log(m);
          for (const track of tracks.filter((track) => track.channel === m.channel - 1)) {
            track.addNote(m.data[1]);
          }
        } else if (m.type === "Note Off") {
          // pass
        } else {
          console.log(m);
        }
      };
    };
    if (
      port.id === favoriteMidiIn
      && doPlay
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
