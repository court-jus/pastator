<script setup lang="ts">

interface Props {
  modelValue?: number
}

defineProps<Props>()

</script>

<script lang="ts">
import { defineComponent } from "vue";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

export default defineComponent({
  data() {
    return {
      value: this.$props.modelValue || 0
    }
  },
  methods: {
    handleChange(newVal: number) {
      this.$emit("update:modelValue", newVal);
    }
  },
  emits: ["update:modelValue"]
});
</script>

<template>
  <div class="container">
    <vue-slider v-model="value" direction="btt" height="100px" contained @change="handleChange"/>
  </div>
</template>

<style scoped>
.container {
    height: 100px;
    width: 32px;
    padding: 0px;
    margin-bottom: 16px;
}
.slider {
    height: 5px;
    cursor: move;
    margin: auto;
    width: 90%;
    border: 1px outset gray;
}
</style>
