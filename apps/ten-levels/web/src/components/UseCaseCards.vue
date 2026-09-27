<script setup lang="ts">
defineProps<{ cases: [string, string][]; selected: string }>();
const emit = defineEmits<{ select: [key: string] }>();
const letter = (i: number) => String.fromCharCode(65 + i);
</script>

<template>
  <div class="cases">
    <button
      v-for="([name, blurb], i) in cases"
      :key="name"
      class="case"
      :class="{ selected: letter(i) === selected }"
      @click="emit('select', letter(i))"
    >
      <div class="case-head"><b>{{ letter(i) }}</b> {{ name }}</div>
      <p>{{ blurb }}</p>
    </button>
  </div>
</template>
