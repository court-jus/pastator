<script setup lang="ts">
import type { MelotorModel, SongData } from "@/model/types";

interface Props {
  melotor: MelotorModel,
  songData: SongData,
}

defineProps<Props>()
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
    }
  },
  emits: ["valueChange"],
  methods: {
    handleChange(ev: Event) {
    }
  }
});
</script>

<template>
  <div class="col-1 text-center" v-for="(noteProba, idx) of melotor.notesProbabilities">
    <Slider :model-value="noteProba"
      @update:model-value="(newVal) => { if (melotor) { melotor.notesProbabilities[idx] = newVal; } }" />
    {{ noteNumberToName(scales[songData.scale][idx] + songData.rootNote, songData, false) }}
  </div>
  <div class="input-group" role="group">
    <span class="input-group-text">Length</span>
    <input class="form-control choose-track-gravity-center" type="number" min="1" max="64" v-model="melotor.meloLength" />
    <span class="input-group-text">Change every</span>
    <DivisionSelector :selected="melotor.meloChangeDiv" @value-change="(newValue: number) => { melotor.meloChangeDiv = newValue; }"/>
    <span class="input-group-text">how much?</span>
    <input class="form-control choose-track-gravity-strength" type="number" min="1" max="27" v-model="melotor.meloChangeStrength" />
    <span class="input-group-text">Chord influence</span>
    <input class="form-control choose-track-gravity-strength" type="number" min="1" max="27" v-model="melotor.chordInfluence" />
  </div>
</template>
