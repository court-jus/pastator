<script setup lang="ts">

interface Props {
  selectedChannel?: number
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      channel: this.$props.selectedChannel || 0
    }
  },
  emits: ["channelChange"],
  methods: {
    handleChange(ev: Event) {
      this.$emit("channelChange", parseInt((ev.target as HTMLSelectElement).value, 10));
    }
  }
});
</script>

<template>
  <select class="form-select" @change="handleChange">
    <option v-for="(_, channel) in new Array(16).fill(0)" :value="channel">{{ channel }}</option>
  </select>
</template>
