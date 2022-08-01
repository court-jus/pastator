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

export default defineComponent({
  data() {
    return {
      viewType: 'reduced'
    };
  },
  methods: {
    cycleView() {
      if (this.viewType === 'reduced') {
        this.viewType = 'expand';
      } else if (this.viewType === 'expand') {
        this.viewType = 'perf';
      } else if (this.viewType === 'perf') {
        this.viewType = 'reduced';
      }
    }
  }
});
</script>


<template>
  <div class="flex-column">
    <h2>
      Tracks
      <button class="btn btn-outline-primary change-track-view" @click="cycleView">
        <i class="bi bi-eye-fill"></i>
        {{ viewType }}
      </button>
    </h2>
    <div id="track-list">
      <Track
        v-for="(track, index) of tracks"
        :device="device"
        :track="track"
        :song-data="songData"
        :clock="clock"
        :clock-start="clockStart"
        :viewType="viewType"
        :remove-track="() => removeTrack(index)" />
    </div>
  </div>
</template>


<style scoped>
</style>
