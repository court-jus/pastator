<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    modelValue: MIDIInput,
    midi: {
      type: MIDIAccess,
      required: true
    }
  },
  emits: ["update:modelValue"]
});
</script>

<template>
  <select
    :value="modelValue?.id"
    @change="$emit('update:modelValue', midi.inputs.get(($event.target as HTMLSelectElement).value))">
    <option v-for="inputDevice of midi.inputs.values()" :value="inputDevice.id">{{inputDevice.name}}</option>
  </select>
</template>

<style scoped>
</style>
