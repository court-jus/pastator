"use strict";

import { connectSystem } from "./midi.js";
import { tracks } from "./song1.js";
import { setUpTracksTable, setUpMainControls } from "./gui.js";

// Notification area to show the connection and error messages.
const notify = document.getElementById("notify");

window.midi = null;

// Send and receive MIDI notes.
window.sendDevice = null;
window.receiveDevice = null;
window.masterClock = 0;


console.log("Starting up...");
if (navigator.requestMIDIAccess) {
  console.log("Setting up GUI");
  setUpMainControls(tracks);
  setUpTracksTable(tracks);
  console.log("Requesting MIDI Access");
  connectSystem(tracks);
} else {
  console.error("No WebMIDI support found");
  notify.innerText = "No WebMIDI support found";
  notify.style.backgroundColor = "hsl(0, 50%, 85%)";
}
