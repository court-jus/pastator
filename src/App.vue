<script setup lang="ts">
import SelectMidiInput from "./components/SelectMidiInput.vue";
import SelectMidiOutput from "./components/SelectMidiOutput.vue";
import Performance from "./components/Performance.vue";
import { getMIDIMessage, isMIDIMessageEvent } from "./model/engine";
import { BarLength } from "./model/presets";
</script>

<script lang="ts">
import type { Tour } from "./types";

interface AppData {
  midiClockDevice?: MIDIInput
  midiOutputDevice?: MIDIOutput
  midiCCDevice?: MIDIInput
  midiNotesDevice?: MIDIInput
  midiSystem?: MIDIAccess
  clock: number
  tour: Tour
  showMidiDevices: boolean
}

function loadMidiDeviceFromLocalStorage(label: string): string | null {
  return localStorage.getItem(label);
}

function loadMidiInputDeviceFromLocalStorage(midi: MIDIAccess, label: string): MIDIInput | undefined {
  return midi.inputs.get(loadMidiDeviceFromLocalStorage(label) || "");
}

function loadMidiOutputDeviceFromLocalStorage(midi: MIDIAccess, label: string): MIDIOutput | undefined {
  return midi.outputs.get(loadMidiDeviceFromLocalStorage(label) || "");
}

export default {
  data(): AppData {
    return {
      midiClockDevice: undefined,
      midiOutputDevice: undefined,
      midiCCDevice: undefined,
      midiNotesDevice: undefined,
      showMidiDevices: localStorage.getItem("midiclock") === null || localStorage.getItem("midioutput") === null,
      midiSystem: undefined,
      clock: 0,
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
          this.midiOutputDevice = loadMidiOutputDeviceFromLocalStorage(access, "midioutput");
          this.midiCCDevice = loadMidiInputDeviceFromLocalStorage(access, "midicc");
          this.midiNotesDevice = loadMidiInputDeviceFromLocalStorage(access, "midinotes");
          this.midiSystem.onstatechange = (event) => {
            console.log("MIDI onstatechange", event);
          };
        },
        (error) => {
          console.error("Unable to access MIDI devices: <i>" + error + "</i>");
        }
      );
    if (localStorage.getItem("skipMainTour") !== "true") {
      this.$tours["mainTour"].start();
    }
  },
  watch: {
    midiClockDevice(newDevice: MIDIInput, oldDevice: MIDIInput | undefined) {
      if (oldDevice !== undefined) {
        oldDevice.onmidimessage = null;
        oldDevice.close();
      }
      newDevice.onmidimessage = (message) => {
        if (isMIDIMessageEvent(message)) {
          const m = getMIDIMessage(message);
          if (m.type === "System" && m.channel === "Stop") {
            this.clock = 0;
          } else if (m.type === "System" && m.channel === "Clock") {
            this.clock += 1;
          }
        };

      }
    }
  },
  methods: {
    onTourFinishedOrSkipped () {
      localStorage.setItem("skipMainTour", "true");
    },
    onLogoClicked () {
      localStorage.removeItem("skipMainTour");
      localStorage.removeItem("skipPerfTour");
      localStorage.removeItem("skipTrackTour");
      this.$tours["mainTour"].start();
    },
    midiDeviceSelected(newDevice: MIDIInput | MIDIOutput, label: string) {
      if (label === "midiclock") {
        this.midiClockDevice = newDevice as MIDIInput;
      } else if (label === "midioutput") {
        this.midiOutputDevice = newDevice as MIDIOutput;
      } else if (label === "midicc") {
        this.midiCCDevice = newDevice as MIDIInput;
      } else if (label === "midinotes") {
        this.midiNotesDevice = newDevice as MIDIInput;
      }
      localStorage.setItem(label, newDevice.id);
    }
  }
}
</script>

<template>
  <nav class="navbar sticky-top navbar-light bg-light justify-content-between px-3 py-0">
    <a class="navbar-brand pt-0 pb-0" href="#">
      <div class="logo-container clickable" @click="onLogoClicked" title="Click to launch the welcome tour.">
        <svg class="logo-led" width="36" height="36" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="80" r="10" :fill="clock ? (clock % BarLength < BarLength / 2 ? 'green' : 'red') : 'gray'" opacity="0.7" />
          <circle cx="239" cy="84" r="10" :fill="clock ? (clock % BarLength >= BarLength / 2 ? 'green' : 'red') : 'gray'" opacity="0.7" />
          <path :fill="(clock && clock % BarLength < BarLength / 4) ? 'green' : 'transparent'"
            d="M 90.332031 119.46875 C 77.563415 121.19668 65.506194 123.57394 55.044922 126.82617 C 53.713247 144.49985 70.04081 162.22181 90.332031 173.5293 L 90.332031 119.46875 z " />
          <path :fill="(clock && 24 <= clock % BarLength && clock % BarLength < BarLength / 2) ? 'green' : 'transparent'"
            d="M 129.79883 116.03516 C 116.25734 116.6867 102.56696 117.79506 89.619141 119.57617 L 89.619141 173.13867 C 102.51898 180.45606 117.0934 185.16742 129.79883 185.61523 L 129.79883 116.03516 z " />
          <path :fill="(clock && 48 <= clock % BarLength && clock % BarLength < BarLength / 4 * 3) ? 'green' : 'transparent'"
            d="M 169.32031 115.19727 C 156.93999 115.17207 143.45164 115.37826 129.79883 116.03516 L 129.79883 185.61523 C 132.30134 185.70344 134.73892 185.64346 137.06836 185.38672 C 148.02393 184.17922 159.63117 179.14963 169.97656 171.9082 L 169.97656 115.20312 C 169.74704 115.2025 169.55061 115.19773 169.32031 115.19727 z " />
          <path :fill="(clock && 72 <= clock % BarLength) ? 'green' : 'transparent'"
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
          <SelectMidiInput :label="'Clock'" :modelValue="midiClockDevice" @update:modelValue="newValue => midiDeviceSelected(newValue, 'midiclock')"
            :midi="midiSystem" />
        </div>
        <div class="row" id="midi-out-selection">
          <SelectMidiOutput :label="'Output'" :modelValue="midiOutputDevice" @update:modelValue="newValue => midiDeviceSelected(newValue, 'midioutput')"
            :midi="midiSystem" />
        </div>
        <div class="row" id="midi-cc-in" v-if="midiOutputDevice && midiClockDevice">
          <SelectMidiInput :label="'Midi CC'" :modelValue="midiCCDevice" @update:modelValue="newValue => midiDeviceSelected(newValue, 'midicc')"
            :midi="midiSystem" />
        </div>
        <div class="row" id="midi-notes-in" v-if="midiOutputDevice && midiClockDevice">
          <SelectMidiInput :label="'Midi Notes'" :modelValue="midiNotesDevice" @update:modelValue="newValue => midiDeviceSelected(newValue, 'midinotes')"
            :midi="midiSystem" />
        </div>
      </div>
    </div>
    <div class="col" v-if="!midiSystem">
      Trying to get access to MIDI System...
    </div>
    <div class="col-12" v-if="midiOutputDevice && midiClockDevice">
      <Performance :device="midiOutputDevice" :clock="clock" :cc-device="midiCCDevice" />
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
</style>
