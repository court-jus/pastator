<script setup lang="ts">
import type { SongData } from "./types";
type TrackList = TrackModel[];

interface Props {
  tracks: TrackList
  songData: SongData
  device: MIDIOutput
  clock: number
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import Track from "./Track.vue";
import type { TrackModel } from "../model/TrackModel";

export default defineComponent({});
</script>


<template>
  <thead>
    <tr>
      <th>&nbsp;</th>
      <th>Ch.</th>
      <th>Div.</th>
      <th colspan="2">Gravity</th>
      <th colspan="3">Notes</th>
      <th>Rythm</th>
      <th>Vel.</th>
      <th colspan="2">Presets</th>
      <th>&nbsp;</th>
    </tr>
  </thead>
  <tbody>
    <Track v-for="track of tracks" :device="device" :track="track" :songData="songData" :clock="clock"/>
  </tbody>
</template>


<style scoped>
</style>
