<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ANIM, C, W, H, heroInner } from "../lib/hero-scenes.mjs";
import type { StreamEvent } from "../lib/api";
import { signal } from "../lib/viz";

/**
 * The run, animated on the level's hero. Consumes the SSE events as they arrive and
 * plays them with minimum durations so a 300 ms call still reads on screen:
 *   request   a packet travels from the input to the Jev node
 *   thinking  the Jev node pulses until the answer lands, elapsed time ticking
 *   response  the packet travels to the outcome, which lights in the answer's bucket color
 *   done      View Results closes the modal; the results are already on the page below
 */
const props = defineProps<{ n: number; title: string; option: string; events: StreamEvent[]; finished: boolean }>();
const emit = defineEmits<{ close: [] }>();

const anim = computed(() => (ANIM as any)[props.n]);
/** The hero markup, minus any element the animation replaces (listed in the spec's `strip`). */
const hero = computed(() => {
  let svg = heroInner(props.n, { lit: false }); // nothing lit until Jev answers
  for (const needle of anim.value?.strip ?? []) {
    svg = svg.replace(new RegExp(`<(?:path|circle|rect)[^>]*${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^>]*/>`), "");
  }
  return svg;
});

const BUCKETS = ["#f935f8", "#f050ec", "#e96ad4", "#e78ab2", "#ebb37f", "#f2e85a", "#d8f066", "#baf77c", "#9dfca4", "#80ffe4"];
const bucketColor = (p: number) => BUCKETS[Math.min(9, Math.max(0, Math.floor(p * 10)))];

type Phase = "idle" | "request" | "thinking" | "response" | "done";
const phase = ref<Phase>("idle");
const status = ref("Ready");
const packetPath = ref("");
const packetKey = ref(0);
const calls = ref(0);
const elapsed = ref(0);
const answerLabel = ref("");
const answerColor = ref(C.accent);
const lit = ref<number[]>([]);
const litColor = ref(C.accent);
const gaugeX = ref<number | null>(null);
const ticks = ref(0);
const authored = ref(0);
const returned = ref("");
const labelBelow = ref(false);
/** Per box color and label, for specs with `rows` (one row of options per question). */
const boxColor = ref<Record<number, string>>({});
const boxLabel = ref<{ idx: number; text: string; color: string }[]>([]);

let timer: number | undefined;
let thinkingStart = 0;
let cursor = 0;
let playing = false;
let lastAnswer: any = null;
let lastQuestions: Record<string, any> = {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function summarize(answers: Record<string, any>) {
  const [id, a] = Object.entries(answers)[0] ?? ["", undefined];
  if (!a) return { label: "", p: 0.5 };
  const p = signal(id, a); // polarity applied: a bad outcome colors magenta even at 0.99
  if (a.type === "noul") return { label: `${a.noul > 0.5 ? "yes" : "no"} ${a.noul.toFixed(2)}`, p };
  if (a.type === "choice") return { label: `${a.choice} ${a.confidence.toFixed(2)}`, p };
  return { label: `${a.score.toFixed(2)} of ${Object.keys(a.legend).length - 1}`, p };
}

function pickFromAnswer(a: any): number | "all" {
  const spec = anim.value;
  if (!spec) return 0;
  const p = spec.pick({}, a);
  if (p === "all") return "all";
  if (a?.type === "noul" && spec.outcomes.length === 2) return a.noul > 0.5 ? 0 : 1;
  return typeof p === "number" ? p : 0;
}

function light(idx: number | "all") {
  const n = anim.value?.outcomes.length ?? 0;
  lit.value = idx === "all" ? Array.from({ length: n }, (_, i) => i) : n ? [Math.min(idx, n - 1)] : [];
}

async function travel(path: string, ms: number) {
  if (!path) return;
  packetPath.value = path;
  packetKey.value++;
  await sleep(ms);
  packetPath.value = "";
}

async function step(e: StreamEvent) {
  const spec = anim.value;
  if (!spec) return;
  const d = e.data;
  if (e.event === "request") {
    lastQuestions = d.questions ?? {};
    calls.value++;
    status.value = calls.value === 1 ? "Sending the state to Jev" : `Call ${calls.value}: sending the state to Jev`;
    phase.value = "request";
    await travel(spec.request, 700);
    phase.value = "thinking";
    thinkingStart = performance.now();
    status.value = "Jev is deciding";
  } else if (e.event === "response") {
    const waited = performance.now() - thinkingStart;
    if (waited < 600) await sleep(600 - waited);
    lastAnswer = Object.values(d.result.answers)[0];
    const { label, p } = summarize(d.result.answers);
    answerLabel.value = label;
    answerColor.value = bucketColor(p);
    litColor.value = answerColor.value;
    status.value = `Jev answered in ${d.result.meta.elapsedMs} ms`;
    phase.value = "response";
    if (spec.rows) {
      // One question per row: travel to the row, then light the box of the option it picked.
      const entries = Object.entries(d.result.answers) as [string, any][];
      lit.value = [];
      boxLabel.value = [];
      for (let r = 0; r < Math.min(entries.length, spec.rows.length); r++) {
        const [qid, a] = entries[r];
        const keys = Object.keys(lastQuestions[qid]?.criteria ?? {});
        const row: number[] = spec.rows[r];
        const idx = row[Math.min(Math.max(0, keys.indexOf(a.choice)), row.length - 1)];
        await travel(spec.responses[r], 500);
        const color = bucketColor(signal(qid, a));
        boxColor.value = { ...boxColor.value, [idx]: color };
        lit.value = [...lit.value, idx];
        boxLabel.value = [...boxLabel.value, { idx, text: String(a.choice ?? ""), color }];
      }
      phase.value = "thinking";
      return;
    }
    const idx = pickFromAnswer(lastAnswer);
    if (spec.gauge) gaugeX.value = spec.gauge(lastAnswer);
    const paths: string[] = spec.responses;
    if (paths.length) {
      const which = idx === "all" ? paths : [paths[Math.min(idx as number, paths.length - 1)]];
      if (idx === "all") {
        packetPath.value = "";
        await sleep(300);
      } else {
        await travel(which[0], 700);
      }
    } else {
      await sleep(400);
    }
    light(idx);
    phase.value = "thinking";
  } else if (e.event === "decision") {
    if (spec.rows) return; // the picks are already on the boxes
    const out = d.output;
    const idx = spec.pick(out, lastAnswer);
    if (idx !== undefined) light(idx);
    const show = (v: unknown) => (typeof v === "boolean" ? (v ? "yes" : "no") : typeof v === "string" ? v : JSON.stringify(v));
    const box = spec.outcomes[typeof idx === "number" ? Math.min(idx, spec.outcomes.length - 1) : 0];
    const fits = Math.floor((box?.w ?? 400) / 19);
    if (out && Array.isArray(out.toolCalls)) {
      // An agent run: what the page can state without reading the agent's prose.
      const n = out.toolCalls.filter((t: any) => t.tool === "jev_decide").length;
      returned.value = `${n} jev_decide call${n === 1 ? "" : "s"}`;
    } else if (Array.isArray(out)) {
      // A list result: count the first boolean field across items, e.g. "1 of 2 supported".
      const flag = out.length ? Object.entries(out[0]).find(([, v]) => typeof v === "boolean") : undefined;
      returned.value = flag ? `${out.filter((x) => x[flag[0]]).length} of ${out.length} ${flag[0]}` : `${out.length} results`;
    } else if (out && typeof out === "object") {
      const entries = Object.entries(out).filter(([k]) => k !== "noul" && k !== "confidence");
      returned.value = entries.length === 1 ? show(entries[0][1]) : entries.map(([k, v]) => `${k} ${show(v)}`).join(", ");
      if (returned.value.length > fits) {
        // Too long for the box: the first string or boolean field alone, else the first field.
        const first = entries.find(([, v]) => typeof v === "string" || typeof v === "boolean") ?? entries[0];
        if (first) returned.value = show(first[1]);
      }
    } else {
      returned.value = show(out);
    }
    // Narrow outcomes (level 7 docs, level 9 dots) get the label below the box instead of inside it.
    labelBelow.value = (box?.w ?? 400) < 200;
    const limit = labelBelow.value ? 26 : fits;
    if (returned.value.length > limit) returned.value = returned.value.slice(0, Math.max(3, limit - 1)) + "…";
  } else if (e.event === "tick") {
    ticks.value++;
  } else if (e.event === "agent-tool-call") {
    authored.value = Object.keys(d.questions ?? {}).length;
    status.value = `The agent authored ${authored.value} question${authored.value === 1 ? "" : "s"}`;
    await sleep(500);
  } else if (e.event === "agent-tool-result" && d.answers) {
    // The agent's jev_decide came back: show the first typed answer like any other response.
    calls.value++;
    lastAnswer = Object.values(d.answers)[0];
    const { label, p } = summarize(d.answers);
    answerLabel.value = label;
    answerColor.value = bucketColor(p);
    litColor.value = answerColor.value;
    status.value = d.elapsedMs ? `Jev answered in ${d.elapsedMs} ms` : "Jev answered";
    light(0);
    await sleep(600);
  } else if (e.event === "agent-text") {
    status.value = "The agent is reasoning";
  } else if (e.event === "option-error") {
    status.value = `Error: ${d.error}`;
  }
}

async function play() {
  if (playing) return;
  playing = true;
  while (cursor < props.events.length) {
    await step(props.events[cursor++]);
  }
  playing = false;
  if (props.finished && cursor >= props.events.length) {
    phase.value = "done";
    status.value = calls.value ? `Done, ${calls.value} call${calls.value === 1 ? "" : "s"}` : "Done";
  }
}

watch(() => props.events.length, play);
watch(() => props.finished, play);

function reset() {
  phase.value = "idle";
  status.value = "Ready";
  packetPath.value = "";
  calls.value = 0;
  elapsed.value = 0;
  answerLabel.value = "";
  lit.value = [];
  gaugeX.value = null;
  ticks.value = 0;
  authored.value = 0;
  returned.value = "";
  labelBelow.value = false;
  boxColor.value = {};
  boxLabel.value = [];
  cursor = 0;
  lastAnswer = null;
}
watch(() => props.events, reset);

timer = window.setInterval(() => {
  if (phase.value === "thinking") elapsed.value = Math.round(performance.now() - thinkingStart);
}, 50);
onBeforeUnmount(() => window.clearInterval(timer));

const outcomeRects = computed(() =>
  lit.value.map((i) => {
    const o = anim.value.outcomes[i];
    return { ...o, rx: o.round ? Math.min(o.w, o.h) / 2 : 18, color: boxColor.value[i] ?? litColor.value };
  }),
);
const labelPos = computed(() => {
  const j = anim.value?.jev ?? { x: 800, y: 450, r: 100 };
  return { x: j.x, y: j.y - j.r - 24 };
});
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div>
          <div class="lvl">Level {{ n }}</div>
          <h2>{{ title }}<span class="meta-inline">Option {{ option }}</span></h2>
        </div>
        <span class="spacer"></span>
        <button class="ghost" @click="emit('close')">Close</button>
      </div>

      <div class="scene-wrap">
      <svg class="scene" :viewBox="`0 0 ${W} ${H}`" v-html="hero"></svg>
      <svg class="scene overlay" :viewBox="`0 0 ${W} ${H}`">
        <defs>
          <filter id="oglow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <rect v-for="(o, i) in outcomeRects" :key="'o' + i" :x="o.x" :y="o.y" :width="o.w" :height="o.h" :rx="o.rx"
          :fill="o.color" fill-opacity=".18" :stroke="o.color" stroke-width="6" filter="url(#oglow)" class="lit"/>

        <text v-for="l in boxLabel" :key="'l' + l.idx" :x="anim.outcomes[l.idx].x + anim.outcomes[l.idx].w / 2" :y="anim.outcomes[l.idx].y + anim.outcomes[l.idx].h / 2 + 11"
          text-anchor="middle" font-size="30" font-weight="700" :fill="l.color" class="ui-text">{{ l.text }}</text>

        <template v-if="anim?.ticks">
          <rect v-for="i in anim.ticks.count" :key="'t' + i" :x="anim.ticks.x + (i - 1) * anim.ticks.step" :y="anim.ticks.y" width="16" height="50" rx="8"
            :fill="i <= ticks ? C.accent : '#15111a'" :filter="i <= ticks ? 'url(#oglow)' : undefined"/>
        </template>

        <g v-if="gaugeX !== null" :transform="`translate(${gaugeX - 830} 0)`" class="needle">
          <line x1="830" y1="400" x2="830" y2="510" :stroke="litColor" stroke-width="10" filter="url(#oglow)"/>
          <circle cx="830" cy="380" r="28" :fill="litColor" filter="url(#oglow)"/>
        </g>

        <g v-if="phase === 'thinking'" class="pulse-group">
          <circle :cx="anim.jev.x" :cy="anim.jev.y" :r="anim.jev.r" :stroke="C.accent" stroke-width="6" fill="none" class="pulse"/>
          <circle :cx="anim.jev.x" :cy="anim.jev.y" :r="anim.jev.r" :stroke="C.accent" stroke-width="6" fill="none" class="pulse late"/>
        </g>

        <circle v-if="packetPath" :key="packetKey" r="18" :fill="C.accent" filter="url(#oglow)">
          <animateMotion :path="packetPath" dur="0.7s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1"/>
        </circle>

        <text v-if="phase === 'thinking'" :x="labelPos.x" :y="labelPos.y" text-anchor="middle" font-size="34" font-weight="700" :fill="C.accent" class="ui-text">
          Jev {{ elapsed }} ms
        </text>
        <text v-if="answerLabel && phase !== 'request'" :x="labelPos.x" :y="labelPos.y + (phase === 'thinking' ? 44 : 0)" text-anchor="middle" font-size="34" font-weight="700" :fill="answerColor" class="ui-text">
          {{ answerLabel }}
        </text>
        <text v-if="returned && outcomeRects[0]" :x="outcomeRects[0].x + outcomeRects[0].w / 2" :y="labelBelow ? outcomeRects[0].y + outcomeRects[0].h + 44 : outcomeRects[0].y + outcomeRects[0].h / 2 + 12" text-anchor="middle" font-size="34" font-weight="700" :fill="litColor" class="ui-text">
          {{ returned }}
        </text>
      </svg>
      </div>

      <div class="modal-foot">
        <span class="status" :class="{ done: phase === 'done' }">{{ status }}</span>
        <span class="spacer"></span>
        <button class="run" :disabled="phase !== 'done'" @click="emit('close')">View Results</button>
      </div>
    </div>
  </div>
</template>

