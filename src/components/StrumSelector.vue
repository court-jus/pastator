<script setup lang="ts">

interface Props {
  selected?: number
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

const StrumOptions = [0, 50, 100, 150, 200, 250, 500, 1000];

export default defineComponent({
  data() {
    return {
      channel: this.$props.selected || 0
    }
  },
  emits: ["change"],
  methods: {
    handleChange(ev: Event) {
      this.$emit("change", parseInt((ev.target as HTMLSelectElement).value, 10));
    }
  }
});
</script>

<template>
  <select class="form-select" @change="handleChange">
    <option v-for="strum in StrumOptions" :value="strum">{{ strum }}</option>
  </select>
</template>
