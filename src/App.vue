<script setup lang="ts">
import SelectMidiDevice from "./components/SelectMidiDevice.vue";
import Performance from "./components/Performance.vue";
import { getMIDIMessage, isMIDIMessageEvent } from "./backends/webmidibackend";
import { BarLength } from "./model/presets";
</script>

<script lang="ts">
import type { Tour } from "./types";
import type { CallBacks, WsMessage } from "./model/types";
import { SongModel } from "./model/SongModel";
import SongInDMinor from "@/examples/dminor";
import SongMelotor from "@/examples/melotor";
import SongDhamar from "@/examples/dhamar";
import { MidiWrapper } from "./backends/backendwrapper";

interface AppData {
  midiClockDevice?: MidiWrapper
  midiOutputDevice?: MidiWrapper
  midiCCDevice?: MidiWrapper
  midiNotesDevice?: MidiWrapper
  remoteMessaging?: MidiWrapper
  midiSystem?: MIDIAccess
  tour: Tour
  showMidiDevices: boolean
  midiDebug: boolean
  midiLogs?: [string, number][]
  song: SongModel
}

function loadMidiDeviceFromLocalStorage(label: string): string | null {
  return localStorage.getItem(label);
}

function loadMidiInputDeviceFromLocalStorage(midi: MIDIAccess, label: string): MidiWrapper | undefined {
  const savedConfig = loadMidiDeviceFromLocalStorage(label) || "";
  if (!savedConfig) return undefined;
  return new MidiWrapper({ midiDevice: midi.inputs.get(savedConfig), otherDevice: savedConfig });
}

function loadMidiOutputDeviceFromLocalStorage(midi: MIDIAccess, label: string): MidiWrapper | undefined {
  const savedConfig = loadMidiDeviceFromLocalStorage(label) || "";
  if (!savedConfig) return undefined;
  return new MidiWrapper({ midiDevice: midi.outputs.get(savedConfig), otherDevice: savedConfig });
}

export default {
  data(): AppData {
    return {
      midiClockDevice: undefined,
      midiOutputDevice: undefined,
      midiCCDevice: undefined,
      midiNotesDevice: undefined,
      remoteMessaging: undefined,
      showMidiDevices: false,
      midiSystem: undefined,
      song: new SongModel("clientserver"),
      midiDebug: false,
      midiLogs: [],
      tour: {
        steps: [
          {
            target: ".logo-container",
            content: "Hi, welcome to Pastator. This quick tour will guide you through the main features. If you finish or skip the tour and want to get back to it later, click the logo."
          },
          {
            target: "#midi-clock-selection",
            content: "Start by selecting the MIDI device that will provide the clock. The logo's eyes should start blinking if MIDI clock events are received."
          },
          {
            target: "#midi-out-selection",
            content: "Then select the MIDI device that will receive note events"
          }
        ],
        callbacks: {
          onFinish: this.onTourFinishedOrSkipped,
          onSkip: this.onTourFinishedOrSkipped,
          onStop: this.onTourFinishedOrSkipped,
        }
      }
    }
  },
  computed: {
    midiCallbacks(): CallBacks {
      return {
        playNote: (channel, note, velocity) => this.midiOutputDevice && this.midiOutputDevice.playNote(channel, note, velocity),
        stopNote: (channel, note) => this.midiOutputDevice && this.midiOutputDevice.stopNote(channel, note),
        remoteMessage: (messageType, messageData) => { this.remoteMessaging?.remoteMessage(messageType, messageData) }
      };
    }
  },
  mounted() {
    navigator
      .requestMIDIAccess({
        sysex: true,
      })
      .then(
        (access) => {
          this.midiSystem = access;
          this.midiClockDevice = loadMidiInputDeviceFromLocalStorage(access, "midiclock");
          if (this.midiClockDevice) this.attachMidiLogger(this.midiClockDevice, "midiclock");
          this.midiOutputDevice = loadMidiOutputDeviceFromLocalStorage(access, "midioutput");
          if (this.midiOutputDevice) this.attachMidiLogger(this.midiOutputDevice, "midioutput");
          this.midiCCDevice = loadMidiInputDeviceFromLocalStorage(access, "midicc");
          if (this.midiCCDevice) this.attachMidiLogger(this.midiCCDevice, "midicc");
          this.midiNotesDevice = loadMidiInputDeviceFromLocalStorage(access, "midinotes");
          if (this.midiNotesDevice) this.attachMidiLogger(this.midiNotesDevice, "midinotes");
          this.midiSystem.onstatechange = (event) => {
            const ev = event as MIDIConnectionEvent;
            this.addMidiLog(`[root] ${ev.port.name} connected`)
          };
        },
        (error) => {
          console.error("Unable to access MIDI devices: <i>" + error + "</i>");
        }
      );
    if (this.midiCCDevice && this.midiCCDevice.isMidiInput() && this.midiCCDevice.midiDevice) {
      this.song.setupCCDevice(this.midiCCDevice.midiDevice as MIDIInput);
    }
    if (localStorage.getItem("skipMainTour") !== "true") {
      this.$tours["mainTour"].start();
    }
    if (this.remoteMessaging === undefined) {
      const params: any = new Proxy(new URLSearchParams(window.location.search), {
        get: (searchParams, prop) => searchParams.get(prop as string)
      });
      if (params.wsUrl) {
        this.remoteMessaging = new MidiWrapper({ otherDevice: "ws:remoteMessaging", wsUrl: params.wsUrl });
        console.debug("Set up listeners from remoteMessaging");
        this.remoteMessaging.addEventListener("setSong", (message: WsMessage) => {
          this.song.apply(message.messageData);
        });
        this.remoteMessaging.addEventListener("setTrack", (message: WsMessage) => {
          const { trackId, data } = message.messageData;
          this.song.tracks[trackId]?.apply(data);
        });
      }
    }
    this.song.callbacks = this.midiCallbacks;
  },
  watch: {
    midiClockDevice(newDevice: MidiWrapper, oldDevice: MidiWrapper | undefined) {
      if (oldDevice !== undefined) {
        oldDevice.close();
      }
      if (newDevice) {
        newDevice.addEventListener("midimessage", (message) => {
          let isClock = message.messageType === "clock";
          if (isMIDIMessageEvent(message)) {
            const m = getMIDIMessage(message);
            this.addMidiLog(`[clock]: ${m.type} ${m.channel}`)
            if (m.type === "System" && m.channel === "Stop") {
              this.song.panic();
              this.song.load({ clock: 0 });
            } else if (m.type === "System" && m.channel === "Start") {
              this.song.playpause(true, true);
            } else if (m.type === "System" && m.channel === "Clock") {
              isClock = true;
            }
          }
          if (isClock) {
            this.song.tick();
          }
        });
      }
    },
    midiCCDevice(newDevice: MIDIInput, oldDevice: MIDIInput | undefined) {
      if (oldDevice !== undefined) {
        oldDevice.onmidimessage = null;
        oldDevice.close();
      }
      this.song.setupCCDevice(newDevice);
    },
    midiOutputDevice(newDevice: MidiWrapper, oldDevice: MidiWrapper | undefined) {
      this.song.callbacks = this.midiCallbacks;
    },
    'song.currentChord'() {
      for (const track of Object.values(this.song.tracks)) {
        track.currentChordChange();
      }
    },
    'song.currentChordType'() {
      for (const track of Object.values(this.song.tracks)) {
        track.currentChordChange();
      }
    }
  },
  methods: {
    addMidiLog(msg: string) {
      if (!this.midiDebug || !this.midiLogs) return;
      if (this.midiLogs.length === 0) this.midiLogs.push([msg, 1]);
      const [lastMessage, count] = this.midiLogs[this.midiLogs.length - 1];
      if (msg === lastMessage) {
        this.midiLogs[this.midiLogs.length - 1][1] += 1;
      } else {
        this.midiLogs.push([msg, 1]);
      }
    },
    onTourFinishedOrSkipped() {
      localStorage.setItem("skipMainTour", "true");
    },
    onLogoClicked () {
      localStorage.removeItem("skipMainTour");
      localStorage.removeItem("skipPerfTour");
      localStorage.removeItem("skipTrackTour");
      this.$tours["mainTour"].start();
    },
    attachMidiLogger(device: MidiWrapper, label: string) {
      if (device.isMidiInput() && device.midiDevice) {
        device.midiDevice.addEventListener("midimessage", (message) => {
          if (!this.midiDebug) return;
          if (isMIDIMessageEvent(message)) {
            const m = getMIDIMessage(message);
            this.addMidiLog(`[${label}.${m.channel}]: ${m.type} ${m.data}`)
          };
        });
      }
    },
    midiDeviceSelected(newDevice: MidiWrapper, label: string) {
      if (label === "midiclock") {
        this.midiClockDevice = newDevice;
      } else if (label === "midioutput") {
        this.midiOutputDevice = newDevice;
      } else if (label === "midicc") {
        this.midiCCDevice = newDevice;
      } else if (label === "midinotes") {
        this.midiNotesDevice = newDevice;
      }
      this.addMidiLog(`${label} selected ${newDevice.name}`);
      this.attachMidiLogger(newDevice, label);
      localStorage.setItem(label, newDevice.id);
    },
    onClearSavedMIDIDevices() {
      this.addMidiLog("Clear MIDI Devices");
      localStorage.removeItem("midiclock");
      localStorage.removeItem("midioutput");
      localStorage.removeItem("midicc");
      localStorage.removeItem("midinotes");
      this.midiClockDevice = undefined;
      this.midiOutputDevice = undefined;
      this.midiCCDevice = undefined;
      this.midiNotesDevice = undefined;
    },
    onMidiDebugBtn() {
      this.midiDebug = !this.midiDebug;
      // if (this.midiDebug) this.midiLogs = [];
    }
  }
}
</script>

<template>
  <nav class="navbar sticky-top navbar-light bg-light justify-content-between px-3 py-0">
    <a class="navbar-brand pt-0 pb-0" href="#">
      <div class="logo-container clickable" @click="onLogoClicked" title="Click to launch the welcome tour.">
        <svg class="logo-led" width="36" height="36" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="80" r="10" :fill="song.clock ? (song.clock % BarLength < BarLength / 2 ? 'green' : 'red') : 'gray'" opacity="0.7" />
          <circle cx="239" cy="84" r="10" :fill="song.clock ? (song.clock % BarLength >= BarLength / 2 ? 'green' : 'red') : 'gray'" opacity="0.7" />
          <path :fill="(song.clock && song.clock % BarLength < BarLength / 4) ? 'green' : 'transparent'"
            d="M 90.332031 119.46875 C 77.563415 121.19668 65.506194 123.57394 55.044922 126.82617 C 53.713247 144.49985 70.04081 162.22181 90.332031 173.5293 L 90.332031 119.46875 z " />
          <path :fill="(song.clock && 24 <= song.clock % BarLength && song.clock % BarLength < BarLength / 2) ? 'green' : 'transparent'"
            d="M 129.79883 116.03516 C 116.25734 116.6867 102.56696 117.79506 89.619141 119.57617 L 89.619141 173.13867 C 102.51898 180.45606 117.0934 185.16742 129.79883 185.61523 L 129.79883 116.03516 z " />
          <path :fill="(song.clock && 48 <= song.clock % BarLength && song.clock % BarLength < BarLength / 4 * 3) ? 'green' : 'transparent'"
            d="M 169.32031 115.19727 C 156.93999 115.17207 143.45164 115.37826 129.79883 116.03516 L 129.79883 185.61523 C 132.30134 185.70344 134.73892 185.64346 137.06836 185.38672 C 148.02393 184.17922 159.63117 179.14963 169.97656 171.9082 L 169.97656 115.20312 C 169.74704 115.2025 169.55061 115.19773 169.32031 115.19727 z " />
          <path :fill="(song.clock && 72 <= song.clock % BarLength) ? 'green' : 'transparent'"
            d="M 169.12305 115.19727 L 169.12305 172.49023 C 189.84401 158.32414 205.76621 135.21221 201.72852 115.69922 C 192.54378 115.46249 181.37048 115.21986 169.12305 115.19727 z " />
        </svg>
        <img alt="Vue logo" class="logo" src="/logo256.png" width="36" height="36" />
      </div>
      <div class="d-inline-block mt-1 align-top">Pastator!</div>
    </a>
    <ul class="nav nav-pills">
      <button class="btn btn-secondary" @click="showMidiDevices = !showMidiDevices">MIDI Devices</button>
    </ul>
  </nav>
  <div class="row">
    <div class="col-6 offset-6" v-if="midiSystem && showMidiDevices">
      <div>
        <div class="row" id="midi-clock-selection">
          <SelectMidiDevice :label="'Clock'" :modelValue="midiClockDevice" @update:modelValue="newValue => midiDeviceSelected(newValue, 'midiclock')"
            :midi="midiSystem" />
        </div>
        <div class="row" id="midi-out-selection">
          <SelectMidiDevice :label="'Output'" :modelValue="midiOutputDevice" @update:modelValue="newValue => midiDeviceSelected(newValue, 'midioutput')"
            :midi="midiSystem" />
        </div>
        <div class="row" id="midi-cc-in" v-if="midiOutputDevice && midiClockDevice">
          <SelectMidiDevice :label="'Midi CC'" :modelValue="midiCCDevice" @update:modelValue="newValue => midiDeviceSelected(newValue, 'midicc')"
            :midi="midiSystem" />
        </div>
        <div class="row" id="midi-notes-in" v-if="midiOutputDevice && midiClockDevice">
          <SelectMidiDevice :label="'Midi Notes'" :modelValue="midiNotesDevice" @update:modelValue="newValue => midiDeviceSelected(newValue, 'midinotes')"
            :midi="midiSystem" />
        </div>
        <div class="row">
          <button class="btn btn-primary btn-warning" @click="onClearSavedMIDIDevices">
            Clear saved MIDI devices
          </button>
        </div>
        <div class="row">
          <button class="btn btn-primary btn-warning" @click="onMidiDebugBtn">
            MIDI Debug
          </button>
        </div>
      </div>
    </div>
    <div class="col" v-if="!midiSystem">
      Trying to get access to MIDI System...
    </div>
    <div class="col-12">
      <Performance :song="song"
                   :playpause="(seq, tracks) => song.playpause(seq, tracks)"
                   :panic="() => song.panic()"
                   :rewind="() => song.rewind()"
                   :load-file="(evt) => song.loadFile(evt)"
                   :save-file="(fileName: string) => song.saveFile(fileName)"
                   :add-track="() => song.addTrack()"
                   :remove-track="(trackId: string) => song.removeTrack(trackId)"
                   :new-project="() => song.newProject()"
                   />
    </div>
    <div class="col-12" v-if="midiDebug">
      <pre v-if="midiLogs">
        <span v-for="[log, count] in midiLogs.slice().reverse().slice(0, 100)">{{count}} - {{ log }}</span>
      </pre>
    </div>
  </div>
  <v-tour name="mainTour" :steps="tour.steps" :callbacks="tour.callbacks" :options="{ highlight: true }"></v-tour>
</template>

<style scoped>
.logo {
  display: block;
  margin: 0 auto 2rem;
}

.logo-container {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 36px;
}

.logo-led {
  position: absolute;
  top: 0;
}

@media (min-width: 1024px) {
  .logo {
    margin: 0 2rem 0 0;
  }
}

pre {
  background-color: lightgray;
  color: black;
  border: 1px solid black;
  font-family: monospace;
}
pre span {
  display: block;
}
</style>
