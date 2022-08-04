<script setup lang="ts">
interface Props {
  modelValue?: MIDIOutput,
  midi: MIDIAccess
  label: string
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      outputs: this.$props.midi.outputs
    };
  },
  emits: ["update:modelValue"],
  mounted() {
    this.$props.midi.onstatechange = (event) => {
      this.outputs = (event.target as MIDIAccess).outputs;
    };
  }
});
</script>

<template>
  <div class="input-group" role="group">
    <span class="input-group-text">{{ $props.label }}</span>
    <select
      class="form-select"
      :value="modelValue?.id"
      @change="$emit('update:modelValue', outputs.get(($event.target as HTMLSelectElement).value))">
      <option v-for="outputDevice of outputs.values()" :value="outputDevice.id">{{outputDevice.name}}</option>
    </select>
  </div>
</template>

<style scoped>
</style>
