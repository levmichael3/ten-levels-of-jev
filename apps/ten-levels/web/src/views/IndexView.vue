<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { LEVELS } from "../lib/levels";
import { revealed, setIndexScroll } from "../lib/store";

/** Each card is 7% larger than the one to its left, so the ladder reads as a ramp. */
const scale = (n: number) => String(1.07 ** (n - 1));

function save() {
  setIndexScroll(window.scrollX);
}

onMounted(() => window.addEventListener("scroll", save, { passive: true }));
onBeforeUnmount(() => {
  save();
  window.removeEventListener("scroll", save);
});
</script>

<template>
  <div class="index-wrap">
    <div class="level-line">
      <RouterLink v-for="L in LEVELS" :key="L.n" class="card" :style="{ '--s': scale(L.n) }" :to="`/level/${L.n}`">
        <div class="hero-box">
          <img v-if="revealed.includes(L.n)" :src="`/heroes/level-${L.n}.svg`" :alt="`Level ${L.n}`" />
          <span v-else class="qq">???</span>
        </div>
        <div class="body">
          <div class="lvl">Level {{ L.n }}</div>
          <h2 v-if="revealed.includes(L.n)">{{ L.title }}</h2>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
