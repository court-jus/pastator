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
      const newChannel = parseInt((ev.target as HTMLSelectElement).value, 10);
      this.channel = newChannel;
      this.$emit("channelChange", newChannel);
    }
  }
});
</script>

<template>
  <select class="form-select" @change="handleChange" :value="channel">
    <option v-for="(_, channel) in new Array(16).fill(0)" :value="channel">{{ channel + 1 }}</option>
  </select>
</template>
