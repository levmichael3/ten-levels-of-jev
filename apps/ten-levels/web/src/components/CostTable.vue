<script setup lang="ts">
import { computed } from "vue";
import { costRows, money, VOLUMES, volumeLabel, type JevUsage } from "../lib/cost";

/**
 * Cost of this exact call, per model, at rising volume. The LLM rows tokenize the Sent
 * and Received bodies with o200k; the Jev row uses the usage the endpoint returned.
 */
const props = defineProps<{ sent: string; received: string; usage: JevUsage }>();
const rows = computed(() => costRows(props.sent, props.received, props.usage));
const jev = computed(() => rows.value.find((r) => r.model.jev)!);
const mult = (x: number) => (x >= 100 ? Math.round(x).toLocaleString("en-US") : x.toFixed(1)) + "x";
</script>

<template>
  <section class="glass wide">
    <h3>Cost</h3>
    <div class="meta">
      This call, priced per model. Jev uses the returned usage{{ usage.cost !== undefined ? " and cost" : "" }}.
      Other models are priced on the same request body in and the same response body out,
      {{ jev.inTokens }} and {{ jev.outTokens }} tokens for Jev, tokenized with o200k for the rest.
    </div>
    <div class="table-wrap">
      <table class="cost">
        <thead>
          <tr>
            <th class="left">Model</th>
            <th>$ / 1M in, out</th>
            <th>tokens in, out</th>
            <th v-for="v in VOLUMES" :key="v">{{ volumeLabel(v) }}</th>
            <th>vs Jev</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.model.name" :class="{ jev: r.model.jev }">
            <td class="left">{{ r.model.name }}</td>
            <td>{{ money(r.model.inPerM) }}, {{ r.model.outPerM ? money(r.model.outPerM) : "free" }}</td>
            <td>{{ r.inTokens.toLocaleString("en-US") }}, {{ r.outTokens.toLocaleString("en-US") }}</td>
            <td v-for="(c, i) in r.atVolume" :key="i" class="mono">{{ money(c) }}</td>
            <td class="mono">{{ r.model.jev ? "1x" : mult(r.timesJev) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
