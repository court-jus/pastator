<script setup lang="ts">
import type { SongData } from "@/model/types";
type TrackList = TrackModel[];

interface Props {
  tracks: TrackList
  songData: SongData
  device: MIDIOutput
  clock: number
  clockStart: number
  removeTrack: (index: number) => void
  viewType: string
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
  <Track
    v-for="(track, index) of tracks"
    :device="device"
    :track="track"
    :song-data="songData"
    :clock="clock"
    :clock-start="clockStart"
    :viewType="viewType"
    :remove-track="() => removeTrack(index)" />
</template>


<style scoped>
</style>
