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
  <div class="flex-column">
    <h2>Tracks</h2>
    <div id="track-list">
      <Track
        v-for="(track, index) of tracks"
        :device="device"
        :track="track"
        :song-data="songData"
        :clock="clock"
        :clock-start="clockStart"
        :viewType="'row'"
        :remove-track="() => removeTrack(index)" />
    </div>
  </div>
</template>


<style scoped>
</style>
