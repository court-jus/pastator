<script setup lang="ts">
import { SongModel } from "@/model/SongModel";

interface Props {
  song: SongModel
  removeTrack: (trackId: string) => void
  viewType: string
}
defineProps<Props>()
</script>

<script lang="ts">
import { defineComponent } from "vue";
import Track from "./Track.vue";

export default defineComponent({});
</script>


<template>
  <Track
    v-for="track of Object.values(song.tracks)"
    :key="track.id"
    :track="track"
    :viewType="viewType"
    :remove-track="() => removeTrack(track.id)" />
</template>
