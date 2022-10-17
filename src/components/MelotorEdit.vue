<script setup lang="ts">
import type { MelotorModel } from "@/model/types";
import { SongModel } from "@/model/SongModel";

interface Props {
  melotor: MelotorModel;
  songData: SongModel;
}

defineProps<Props>();
</script>

<script lang="ts">
import { noteNumberToName } from "@/model/engine";
import { scales } from "@/model/presets";
import { defineComponent } from "vue";
import Slider from "./Slider.vue";
import DivisionSelector from "./DivisionSelector.vue";

export default defineComponent({
  data() {
    return {
      internalValue: this.melotor,
    };
  },
  emits: ["valueChange"],
  watch: {
    internalValue: {
      handler(newVal: MelotorModel) {
        this.$emit("valueChange", newVal);
      },
      deep: true,
    },
  },
});
</script>

<template>
  <div
    class="col-1 text-center"
    v-for="(noteProba, idx) of internalValue.notesProbabilities"
    v-bind:key="idx"
  >
    <Slider
      :model-value="noteProba"
      @update:model-value="
        (newVal) => {
          if (internalValue) {
            internalValue.notesProbabilities[idx] = newVal;
          }
        }
      "
    />
    {{
      noteNumberToName(
        scales[songData.scale][idx] + songData.rootNote,
        songData,
        false
      )
    }}
  </div>
  <div class="input-group" role="group">
    <span class="input-group-text">Length</span>
    <input
      class="form-control choose-track-gravity-center"
      type="number"
      min="1"
      max="64"
      v-model="internalValue.meloLength"
    />
    <span class="input-group-text">Change every</span>
    <DivisionSelector
      :selected="internalValue.meloChangeDiv"
      @value-change="(newValue: number) => { internalValue.meloChangeDiv = newValue; }"
    />
    <span class="input-group-text">how much?</span>
    <input
      class="form-control choose-track-gravity-strength"
      type="number"
      min="0"
      max="100"
      v-model="internalValue.meloChangeStrength"
    />
    <span class="input-group-text">Chord influence</span>
    <input
      class="form-control choose-track-gravity-strength"
      type="number"
      min="0"
      max="100"
      v-model="internalValue.chordInfluence"
    />
  </div>
</template>
