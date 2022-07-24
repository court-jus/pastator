"use strict";

import { connectSystem } from "./midi.js";
import { Sequencer } from "./sequencer.js";
import { setUpMainControls } from "./gui.js";
import { loadPreferences, savePreferences } from "./prefs.js";

// Notification area to show the connection and error messages.
const notify = document.getElementById("notify");
const preferences = loadPreferences();
console.log("Loaded prefs", preferences);

window.midi = null;

// Send and receive MIDI notes.
window.sendDevice = null;
window.receiveDevice = null;
window.masterClock = 0;

console.log("Starting up...");
if (navigator.requestMIDIAccess) {
  console.log("Setting up GUI");
  const sequencer = new Sequencer(preferences);
  setUpMainControls(sequencer);
  console.log("Requesting MIDI Access");
  connectSystem(preferences, sequencer);
  window.setInterval(() => {
    savePreferences(preferences);
  }, 10000);
} else {
  console.error("No WebMIDI support found");
  notify.innerText = "No WebMIDI support found";
  notify.style.backgroundColor = "hsl(0, 50%, 85%)";
}
