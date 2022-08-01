<script setup lang="ts">
import type { PresetCategories } from "@/model/types";

interface Props {
  data: PresetCategories,
  selectedCategory?: string,
  selectedPreset?: string
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  data() {
    return {
      category: this.$props.selectedCategory || "nil",
      preset: this.$props.selectedPreset || "nil"
    }
  },
  methods: {
    handlePresetChange(ev: Event) {
      const value = this.$props.data[this.category].filter((value) => value.id === this.preset);
      if (value.length === 1) {
        this.$emit(
          'presetChange',
          { ...value[0], category: this.category }
        )
      }
    }
  },
  emits: ['categoryChange', 'presetChange']
})
</script>

<template>
  <div class="input-group" role="group">
    <span class="input-group-text">Preset</span>
    <select class="form-select" v-model="category">
      <option value="nil">---</option>
      <option
        v-for="(, category) of data"
        :value="category">
        {{ category }}
      </option>
    </select>
    <select class="form-select" v-model="preset" @change="handlePresetChange">
      <option value="nil">---</option>
      <option
        v-if="category !== 'nil'"
        v-for="preset of data[category]"
        :value="preset.id">
        {{ preset.label }}
      </option>
    </select>
  </div>
</template>