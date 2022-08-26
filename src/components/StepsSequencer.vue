<script setup lang="ts">
interface Props {
  modelValue: number[],
  position: number
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["update:modelValue"],
  methods: {
    computedStyle(vel: number, idx: number) {
      const style: Record<string, any> = {
        width: 100 / this.modelValue.length + '%',
        backgroundColor: "rgba(0, 0, 0, " + (vel / 100) + ")"
      };
      if ((this.position % this.modelValue.length) === idx) {
        style["borderColor"] = "red";
      }
      return style;
    },
    handleClick(idx: number) {
      this.modelValue[idx] = (
        (this.modelValue[idx] > 0) ? 0 : 100
      )
      this.$emit("update:modelValue", this.modelValue);
    }
  }
});
</script>

<template>
  <div class="row">
    <div class="col-12">
      <div class="step clickable"
           v-for="(vel, idx) in modelValue"
           :key="idx"
           :style="computedStyle(vel, idx)"
           @click="() => handleClick(idx)">
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
