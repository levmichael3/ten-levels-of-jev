<script setup lang="ts">
import { LEVELS } from "../lib/levels";

defineProps<{ n: number }>();
</script>

<template>
  <div class="progress" aria-label="Level progress">
    <RouterLink
      v-for="L in LEVELS"
      :key="L.n"
      :to="`/level/${L.n}`"
      class="seg"
      :class="{ done: L.n < n, current: L.n === n }"
      :title="`Level ${L.n}: ${L.title}`"
    ></RouterLink>
  </div>
</template>
