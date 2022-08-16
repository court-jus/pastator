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
        width: 100 / this.$props.modelValue.length + '%',
        backgroundColor: "rgba(0, 0, 0, " + (vel / 100) + ")"
      };
      if ((this.$props.position % this.$props.modelValue.length) === idx) {
        style["borderColor"] = "red";
      }
      return style;
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
      <div class="step clickable" v-for="(vel, idx) in $props.modelValue" :style="computedStyle(vel, idx)" @click="() => handleClick(idx)">
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
