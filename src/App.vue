<script setup lang="ts">
import SelectMidiInput from "./components/SelectMidiInput.vue";
import SelectMidiOutput from "./components/SelectMidiOutput.vue";
import { ProjectModel } from "./model/ProjectModel";
import Performance from "./components/Performance.vue";
import { getMIDIMessage } from "./model/engine";
</script>

<script lang="ts">

function isMIDIMessageEvent(event: Event | MIDIMessageEvent): event is MIDIMessageEvent {
  return (event as MIDIMessageEvent).data !== undefined;
};

interface Tour {
  target: string
  content: string
}

interface AppData {
  midiClockDevice?: MIDIInput
  midiOutputDevice?: MIDIOutput
  midiSystem?: MIDIAccess
  project: ProjectModel
  clock: number
  tours: Record<string, Tour[]>
  tourCallbacks: Record<string, (() => {}) | undefined>
}

export default {
  data(): AppData {
    return {
      midiClockDevice: undefined,
      midiOutputDevice: undefined,
      midiSystem: undefined,
      project: new ProjectModel(),
      clock: 0,
      tours: {
        main: [
          {
            target: ".topleft-section",
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
        ]
      },
      tourCallbacks: {
        onFinish: this.onTourFinishedOrSkipped,
        onSkip: this.onTourFinishedOrSkipped,
        onStop: this.onTourFinishedOrSkipped,
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
            // song.fullStop();
          } else if (m.type === "System" && m.channel === "Clock") {
            this.clock += 1;
          }
        };

      }
    }
  },
  methods: {
    onTourFinishedOrSkipped () {
      console.log("VUTOUR ENDED");
      localStorage.setItem("skipMainTour", "true");
    },
    onLogoClicked () {
      console.log("LOGO CLIEKD");
      localStorage.removeItem("skipMainTour");
      this.$tours["mainTour"].start();
    }
  }
}
</script>

<template>
  <v-tour name="mainTour" :steps="tours.main" :callbacks="tourCallbacks" :options="{ highlight: true }"></v-tour>
  <section class="topleft-section">
    <div @click="onLogoClicked" class="clickable" title="Click to launch the welcome tour.">
      <svg class="logo-led" width="125" height="125" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="80" r="10" :fill="clock ? (clock % 48 < 24 ? 'green' : 'red') : 'gray'" opacity="0.7" />
        <circle cx="239" cy="84" r="10" :fill="clock ? (clock % 48 >= 24 ? 'green' : 'red') : 'gray'" opacity="0.7" />
        <path :fill="(clock && clock % 48 < 12) ? 'green' : 'transparent'"
          d="M 90.332031 119.46875 C 77.563415 121.19668 65.506194 123.57394 55.044922 126.82617 C 53.713247 144.49985 70.04081 162.22181 90.332031 173.5293 L 90.332031 119.46875 z " />
        <path :fill="(clock && 12 <= clock % 48 && clock % 48 < 24) ? 'green' : 'transparent'"
          d="M 129.79883 116.03516 C 116.25734 116.6867 102.56696 117.79506 89.619141 119.57617 L 89.619141 173.13867 C 102.51898 180.45606 117.0934 185.16742 129.79883 185.61523 L 129.79883 116.03516 z " />
        <path :fill="(clock && 24 <= clock % 48 && clock % 48 < 36) ? 'green' : 'transparent'"
          d="M 169.32031 115.19727 C 156.93999 115.17207 143.45164 115.37826 129.79883 116.03516 L 129.79883 185.61523 C 132.30134 185.70344 134.73892 185.64346 137.06836 185.38672 C 148.02393 184.17922 159.63117 179.14963 169.97656 171.9082 L 169.97656 115.20312 C 169.74704 115.2025 169.55061 115.19773 169.32031 115.19727 z " />
        <path :fill="(clock && 36 <= clock % 48) ? 'green' : 'transparent'"
          d="M 169.12305 115.19727 L 169.12305 172.49023 C 189.84401 158.32414 205.76621 135.21221 201.72852 115.69922 C 192.54378 115.46249 181.37048 115.21986 169.12305 115.19727 z " />

      </svg>
      <img alt="Vue logo" class="logo" src="/logo256.png" width="125" height="125" />
    </div>
  </section>
  <section>
    <div>
      <h1>Pastator!</h1>
    </div>
  </section>
  <section class="main-section">
    <div v-if="midiOutputDevice && midiClockDevice">
      <h1>Performance</h1>
      <Performance :device="midiOutputDevice" :clock="clock" />
    </div>
  </section>
  <section class="topright-section">
    <div v-if="midiSystem">
      <h1>Midi devices</h1>
      <ul>
        <li id="midi-clock-selection">Clock:
          <SelectMidiInput :modelValue="midiClockDevice" @update:modelValue="newValue => midiClockDevice = newValue"
            :midi="midiSystem" />
        </li>
        <li id="midi-out-selection">Output:
          <SelectMidiOutput :modelValue="midiOutputDevice" @update:modelValue="newValue => midiOutputDevice = newValue"
            :midi="midiSystem" />
        </li>
      </ul>
    </div>
    <div v-else>Trying to get access to MIDI System...</div>
  </section>
</template>

<style scoped>
.logo {
  display: block;
  margin: 0 auto 2rem;
}

.topleft-section {
  position: relative;
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