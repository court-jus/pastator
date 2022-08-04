<script setup lang="ts">
interface Props {
  modelValue?: MIDIInput,
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
      inputs: this.$props.midi.inputs
    };
  },
  emits: ["update:modelValue"],
  mounted() {
    this.$props.midi.onstatechange = (event) => {
      this.inputs = (event.target as MIDIAccess).inputs;
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
      @change="$emit('update:modelValue', inputs.get(($event.target as HTMLSelectElement).value))">
      <option v-for="inputDevice of inputs.values()" :value="inputDevice.id">{{inputDevice.name}}</option>
    </select>
  </div>
</template>

<style scoped>
</style>
