<script setup lang="ts">
import { rythmPresets } from "@/model/presets";

interface Props {
  selectedPreset?: string
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      preset: this.$props.selectedPreset || "nil"
    }
  },
  emits: ["presetChange"],
  methods: {
    handleChange(ev: Event) {
      this.$emit("presetChange", (ev.target as HTMLSelectElement).value);
    }
  }
});
</script>

<template>
  <select class="form-select" @change="handleChange">
    <option value="nil">---</option>
    <option v-for="(rythmPreset, rythmId) of rythmPresets" :value="rythmId">{{ rythmPreset.label }}</option>
  </select>
</template>
