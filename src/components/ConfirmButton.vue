<script setup lang="ts">

interface Props {
  label: string
}
defineProps<Props>()
</script>


<script lang="ts">
import { defineComponent } from "vue";

interface Data {
    clicked: boolean;
    confirmed: boolean;
    color?: string;
}
export default defineComponent({
  data(): Data {
    return {
      clicked: false,
      confirmed: false,
      color: undefined
    };
  },
  methods: {
    reset() {
        this.confirmed = false;
        this.clicked = false;
        this.color = undefined;
    },
    handleClick() {
        if (this.clicked && !this.confirmed) {
            this.confirmed = true;
            this.color = 'rgb(127,255,127)';
            setTimeout(() => {
                this.$emit("confirmed", true);
                this.reset();
            }, 250);
        } else if (this.clicked && this.confirmed) {
            this.reset();
        } else {
            this.clicked = true;
            this.confirmed = false;
            this.color = 'rgb(255,127,127)';
            setTimeout(this.reset, 1000);
        }
    }
  },
  emits: ["confirmed"]
});
</script>

<template>
<button class="btn btn-outline-primary" @click="handleClick">
    <div :style="{color}" :title="clicked ? (confirmed ? 'OK, done' : 'Are you sure?') : $props.label">
        <slot v-if="!clicked && !confirmed">défault</slot>
        <i class="bi bi-question-octagon-fill" v-if="clicked && !confirmed"></i>
        <i class="bi bi-hand-thumbs-up-fill" v-if="clicked && confirmed"></i>
    </div>
</button>
</template>

<style scoped>
</style>
