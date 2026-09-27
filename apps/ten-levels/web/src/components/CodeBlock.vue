<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { highlightTs } from "../lib/highlight";

/**
 * Editor-style code block: a line number gutter with click and drag selection.
 * Click a number to highlight that line, drag across numbers for a range,
 * click the same selection again to clear, click anywhere outside to clear.
 */
const props = defineProps<{ code: string; file?: string }>();

const lines = computed(() => props.code.replace(/\n$/, "").split("\n").map((l) => highlightTs(l)));

const root = ref<HTMLElement | null>(null);
const anchor = ref<number | null>(null);
const from = ref<number | null>(null);
const to = ref<number | null>(null);
const dragging = ref(false);

const isSelected = (i: number) => from.value !== null && to.value !== null && i >= from.value && i <= to.value;

function clear() {
  anchor.value = from.value = to.value = null;
}

function down(i: number, e: MouseEvent) {
  e.preventDefault();
  const same = from.value === i && to.value === i;
  if (same) {
    clear();
    return;
  }
  anchor.value = from.value = to.value = i;
  dragging.value = true;
}

function over(i: number) {
  if (!dragging.value || anchor.value === null) return;
  from.value = Math.min(anchor.value, i);
  to.value = Math.max(anchor.value, i);
}

function up() {
  dragging.value = false;
}

function outside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) clear();
}

onMounted(() => {
  window.addEventListener("mouseup", up);
  document.addEventListener("mousedown", outside);
});
onBeforeUnmount(() => {
  window.removeEventListener("mouseup", up);
  document.removeEventListener("mousedown", outside);
});
</script>

<template>
  <div ref="root" class="editor" :class="{ dragging }">
    <div v-if="file" class="tab"><span class="tab-name">{{ file }}</span><span class="tab-lines">{{ lines.length }} lines</span></div>
    <div
      v-for="(html, i) in lines"
      :key="i"
      class="ln"
      :class="{ sel: isSelected(i) }"
    >
      <span class="num" @mousedown="down(i, $event)" @mouseenter="over(i)">{{ i + 1 }}</span>
      <span class="src" v-html="html || ' '"></span>
    </div>
  </div>
</template>
