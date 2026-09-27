<script setup lang="ts">
import { computed } from "vue";
import { highlightTs, renderCall } from "../lib/highlight";
import CodeBlock from "./CodeBlock.vue";

/** The call line updates as the input is edited. The file body is the real source, untouched. */
const props = defineProps<{ file: string; call: string; code: string; input: Record<string, unknown> }>();
const callHtml = computed(() => highlightTs(renderCall(props.call, props.input)));
</script>

<template>
  <section class="glass wide">
    <h3>Code</h3>
    <div class="meta">The call, with your input</div>
    <pre class="code call" v-html="callHtml"></pre>
    <CodeBlock :code="code" :file="file" />
  </section>
</template>
