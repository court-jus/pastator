<script setup lang="ts">

interface Props {
  selected?: number
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

const Choices = [
  ['1/32', 3],
  ['1/16T', 4],
  ['1/16', 6],
  ['1/8T', 8],
  ['1/8', 12],
  ['1/4T', 16],
  ['1/4', 24],
  ['1/2', 48],
  ['1', 96],
  ['2', 192],
  ['Manual', 0],
];

export default defineComponent({
  data() {
    return {
      internalValue: this.$props.selected || 0,
      manualValue: this.$props.selected || 0,
      showManualValue: false
    }
  },
  emits: ["valueChange"],
  methods: {
    handleChange(ev: Event) {
      const newValue = parseInt((ev.target as HTMLSelectElement).value, 10);
      this.internalValue = newValue;
      if (newValue === 0) {
        this.showManualValue = true;
        return;
      } else {
        this.showManualValue = false;
      }
      this.manualValue = newValue;
      this.$emit("valueChange", newValue);
    },
    handleManualValueChange(ev: Event) {
      const newValue = parseInt((ev.target as HTMLInputElement).value, 10);
      this.manualValue = newValue;
      this.$emit("valueChange", newValue);
    }
  }
});
</script>

<template>
  <span class="input-group-text">Div.</span>
  <input v-if="showManualValue" class="form-control choose-track-division" type="number" min="3" :value="manualValue" @change="handleManualValueChange" />
  <select class="form-select" @change="handleChange" :value="internalValue">
    <option v-for="[label, choice] of Choices" :value="choice">{{ label }}</option>
  </select>
</template>
