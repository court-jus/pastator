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

interface AppData {
  midiClockDevice?: MIDIInput
  midiOutputDevice?: MIDIOutput
  midiSystem?: MIDIAccess
  project: ProjectModel
  clock: number
}

export default {
  data() {
    return {
      midiClockDevice: undefined,
      midiOutputDevice: undefined,
      midiSystem: undefined,
      project: new ProjectModel(),
      clock: 0,
    } as AppData
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
            if (this.clock % 24 === 0) {
              /*
              const led = document.getElementById("clock-led");
              if (led.className.indexOf("red") === -1) {
                led.className = "led red-led";
              } else {
                led.className = "led green-led";
              }
              */
            }
            /*
            song.tick();
            if (sequencer) sequencer.tick();
            */
            this.clock += 1;
          }
        };

      }
    }
  }
}
</script>

<template>
  <section class="topleft-section">
    <svg class="logo-led" width="125" height="125" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="80" r="10" :fill="clock ? (clock % 48 > 24 ? 'green' : 'red'): 'gray'" opacity="0.7" />
      <circle cx="239" cy="84" r="10" fill="red" opacity="0.7" />
    </svg>
    <img alt="Vue logo" class="logo" src="/logo256.png" width="125" height="125" />
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
        <li>Clock:
          <SelectMidiInput :modelValue="midiClockDevice" @update:modelValue="newValue => midiClockDevice = newValue"
            :midi="midiSystem" />
        </li>
        <li>Output:
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
