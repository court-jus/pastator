<script setup lang="ts">
interface Props {
  modelValue?: number
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["update:modelValue"]
});
</script>

<template>
  <div class="container">
    <div class="slider">
        &nbsp;
    </div>
  </div>
</template>

<style scoped>
.container {
    background-color: black;
    height: 32px;
    width: 32px;
    padding: 0px;
}
.slider {
    background-color: white;
    height: 5px;
    cursor: pointer;
    margin: auto;
    width: 90kol  %;
}
</style>
