<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    modelValue: MIDIOutput,
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
    @change="$emit('update:modelValue', midi.outputs.get(($event.target as HTMLSelectElement).value))">
    <option v-for="outputDevice of midi.outputs.values()" :value="outputDevice.id">{{outputDevice.name}}</option>
  </select>
</template>

<style scoped>
</style>
