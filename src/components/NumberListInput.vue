<script setup lang="ts">

interface Props {
  modelValue: Number[]
  readonly?: boolean
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
  <input :readonly="readonly" class="form-control" :value="modelValue.join(' ')" @change="
    $emit(
      'update:modelValue',
      ($event.target as HTMLInputElement).value.split(' ').map(
        (val: string) => parseInt(val, 10)
      )
    )
  " />
</template>

<style scoped>
</style>
