<script setup lang="ts">

interface Props {
  selected?: number,
  showLabel?: boolean
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import { BarLength } from "@/model/presets";

const Choices = [
  ['1/32', BarLength / 32],
  ['1/16T', BarLength / 24],
  ['1/16', BarLength / 16],
  ['1/8T', BarLength / 12],
  ['1/8', BarLength / 8],
  ['1/4T', BarLength / 6],
  ['1/4', BarLength / 4],
  ['1/2', BarLength / 2],
  ['1', BarLength],
  ['2', BarLength * 2],
  ['4', BarLength * 4],
  ['8', BarLength * 8],
  ['Manual', 0],
];

const PresetValues = Choices.map(([_, value]) => value);

export default defineComponent({
  data() {
    return {
      internalValue: (this.$props.selected && PresetValues.indexOf(this.$props.selected) >= 0) ? this.$props.selected : 0,
      manualValue: this.$props.selected || 0,
      showManualValue: !(this.$props.selected && PresetValues.indexOf(this.$props.selected) >= 0)
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
  <span v-if="showLabel" class="input-group-text">Div.</span>
  <input v-if="showManualValue" class="form-control choose-track-division" type="number" min="3" :value="manualValue" @change="handleManualValueChange" />
  <select class="form-select" @change="handleChange" :value="internalValue">
    <option v-for="[label, choice] of Choices" :value="choice">{{ label }}</option>
  </select>
</template>
