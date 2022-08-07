<script setup lang="ts">
interface Props {
  modelValue: number[]
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["update:modelValue"],
  methods: {
    computedStyle(vel: number) {
      return {
        width: 100 / this.$props.modelValue.length + '%',
        backgroundColor: "rgba(0, 0, 0, " + (vel / 100) + ")"
      };
    },
    handleClick(idx: number) {
      this.$props.modelValue[idx] = (
        (this.$props.modelValue[idx] > 0) ? 0 : 100
      )
    }
  }
});
</script>

<template>
  <div class="row">
    <div class="col-12">
      <div class="step clickable" v-for="(vel, idx) in $props.modelValue" :style="computedStyle(vel)" @click="() => handleClick(idx)">
        &nbsp;
      </div>
    </div>
  </div>
</template>

        
<style scoped>
.step {
  display: inline-block;
  border: 1px solid lightgrey;
  border-radius: 5px;
  height: 2rem;
}
</style>
