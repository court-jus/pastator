<script setup lang="ts">
interface Props {
  density: number,
  mode: EuclideanMode
}

defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import type { EuclideanMode } from "@/model/types";
import { computeEuclideanValue, computeEuclidean } from "@/model/engine";

const GridSize = 64;

export default defineComponent({
  emits: ["update:modelValue"],
  methods: {
    getStyle(col: number, row: number): Record<string, any> {
      const euclidean = computeEuclidean(col, row, this.density, GridSize, this.mode);
      if (euclidean === null) return { backgroundColor: "white" };
      if (euclidean === 1) return { backgroundColor: "black" };
      return { backgroundColor: "lightgray" };
    }
  }
});
</script>

<template>
  <div class="row">
    <div class="col-12">
      <table>
        <tr v-for="(_, rowidx) in new Array(GridSize).fill(0)">
          <td v-for="(_, colidx) in new Array(GridSize).fill(0)" :style="getStyle(colidx, rowidx)">
            &nbsp;
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

        
<style scoped>
td {
  width: 2px;
  height: 2px;
  max-width: 2px;
  max-height: 2px;
  line-height: 0;
  padding: 0;
  overflow: hidden;
}
</style>
