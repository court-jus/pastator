<script setup lang="ts">
interface Props {
  modelValue?: MidiWrapper
  midi?: MIDIAccess
  isOutput?: boolean
  label: string
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import { MidiWrapper } from "@/backends/backendwrapper";
import type { MidiWrapperConfig } from "@/backends/backendwrapper";
import { getInternalClock } from "@/backends/internalclock";

const SpecialDevices = ["ws:", "InternalClock"];

export default defineComponent({
  data() {
    return {
      internalValue: this.modelValue?.id,
      choices: this.midi && (this.isOutput ? this.midi.outputs : this.midi.inputs)
    };
  },
  emits: ["update:modelValue"],
  watch: {
    modelValue(newVal) {
      this.internalValue = this.modelValue?.id;
    }
  },
  methods: {
    handleChange(ev: Event) {
      const value = (ev.target as HTMLSelectElement).value;
      const wrapperConfig: MidiWrapperConfig = {};
      if (SpecialDevices.indexOf(value) >= 0) {
        wrapperConfig.otherDevice = value;
      } else {
        wrapperConfig.midiDevice = this.choices && this.choices.get(value);
      }
      const wrapper = value === "InternalClock" ? getInternalClock(128) : new MidiWrapper(wrapperConfig);
      if (wrapper.active) {
        this.$emit("update:modelValue", wrapper);
      } else {
        this.$emit("update:modelValue", undefined);
      }
    }
  },
  mounted() {
    if (this.midi) {
      this.midi.onstatechange = (event) => {
        this.choices = this.midi && (this.isOutput ? this.midi.outputs : this.midi.inputs);
      };
    }
  }
});
</script>

<template>
  <div class="input-group" role="group">
    <span class="input-group-text">{{ $props.label }}</span>
    <select class="form-select" :value="internalValue" @change="handleChange">
      <option v-if="choices" v-for="inputDevice of choices.values()" :value="inputDevice.id" :key="inputDevice.id">
        {{ inputDevice.name }}
      </option>
      <option v-for="specialdevice of SpecialDevices" :value="specialdevice" :key="specialdevice">{{ specialdevice }}</option>
    </select>
  </div>
</template>

<style scoped>
</style>
