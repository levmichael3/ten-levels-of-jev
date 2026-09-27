/**
 * Level 7 extension: should I compact.
 *
 *   turn_end   build the state from the session, one Jev call, decide the tier, report it
 *   context    inject the tier message as a transient custom message, only when not silent
 *   tools      compact_now(note_to_self) wraps ctx.compact; should_i_compact returns the verdict on demand
 *   session_before_compact   asks Jev which turn starts the live work and folds it into the instructions
 *
 * Numbers stay in code: context usage from ctx.getContextUsage, the lines from the lab config.
 * Load: pi -e extensions/jev-compact.ts --tools read,bash,edit,write,compact_now,should_i_compact
 */
import { Type } from "typebox";
import { SettingsManager } from "@earendil-works/pi-coding-agent";
import { decide, levelConfig, report } from "./report.ts";
import {
  COMPACT_QUESTIONS, DEFAULT_LINES, decideTier, tierMessage, compactVerdict, cutPointQuestion, cutPointInstructions,
  type CompactAnswers, type CompactState, type CompactDecision, type Lines, type TurnSummary,
} from "../src/levels/level07/index.ts";

const GUIDANCE = "jev-compact-guidance";
/** pi cannot compact what fits in keepRecentTokens. The sandbox sets it low in .pi/settings.json. */
function keepRecentTokens(cwd: string): number {
  try { return SettingsManager.create(cwd).getCompactionKeepRecentTokens(); } catch { return 20_000; }
}
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const textOf = (m: any): string =>
  (Array.isArray(m?.content) ? m.content.filter((c: any) => c?.type === "text").map((c: any) => c.text).join("\n") : String(m?.content ?? "")).trim();

export default function (pi: any) {
  const cfg = levelConfig<{ lines: Lines }>({ lines: DEFAULT_LINES });
  const lines: Lines = { ...DEFAULT_LINES, ...(cfg.lines ?? {}) };

  const userMessages: string[] = [];
  let lastSummary = "";
  let turn = 0;
  let pendingCompaction = false; // compact_now was called; quiet until pi compacts
  let current: { decision: CompactDecision; message: string | null; usage: { tokens: number; pct: number }; answers: CompactAnswers } | null = null;

  function usageOf(ctx: any): { tokens: number; window: number; pct: number } {
    const u = ctx.getContextUsage?.();
    const window = u?.contextWindow ?? ctx.model?.contextWindow ?? 0;
    const tokens = u?.tokens ?? 0;
    const pct = u?.percent ?? (window > 0 ? (tokens / window) * 100 : 0);
    return { tokens, window, pct };
  }

  function buildState(event: any): CompactState {
    const previous = [...userMessages.slice(0, -1).map((m) => clip(m, 200)), lastSummary ? `Summary so far: ${clip(lastSummary, 400)}` : ""].filter(Boolean).join("\n");
    const tools = (event.toolResults ?? []).map((r: any) => r?.toolName ?? r?.name).filter(Boolean);
    return {
      current_request: clip(userMessages.at(-1) ?? "", 600),
      previous_work: previous || "(nothing before this request)",
      recent_turn: clip(textOf(event.message) || `(tool calls only: ${tools.join(", ") || "none"})`, 600),
      tools_this_turn: tools,
    };
  }

  async function evaluate(ctx: any, event: any, source: string) {
    const usage = usageOf(ctx);
    const state = buildState(event);
    const compactable = usage.tokens > keepRecentTokens(ctx.cwd);
    if (pendingCompaction && source === "turn_end") {
      const decision: CompactDecision = { tier: "silent", reason: "compaction requested, waiting for pi to run it" };
      current = { decision, message: null, usage, answers: null as unknown as CompactAnswers };
      report(pi, "hook", { hook: source, turn, usage, lines, compactable, tier: decision.tier, reason: decision.reason, message: null, skipped: true });
      return current;
    }
    if (userMessages.length < 2) {
      // Nothing to move on from yet. No call, no cost, and the agent hears nothing.
      const decision: CompactDecision = { tier: "silent", reason: "first request, nothing to move on from" };
      current = { decision, message: null, usage, answers: null as unknown as CompactAnswers };
      report(pi, "hook", { hook: source, turn, usage, lines, compactable, tier: decision.tier, reason: decision.reason, message: null, skipped: true });
      return current;
    }
    const { answers } = await decide(pi, source, state, COMPACT_QUESTIONS, { turn, context: usage, lines });
    const a = answers as unknown as CompactAnswers;
    const decision = decideTier(a, usage, compactable, lines, state);
    const message = tierMessage(decision, usage);
    current = { decision, message, usage, answers: a };
    report(pi, "hook", { hook: source, turn, usage, lines, compactable, tier: decision.tier, reason: decision.reason, message });
    return current;
  }

  pi.on("message_end", async (event: any) => {
    if (event.message?.role === "user") userMessages.push(textOf(event.message));
  });

  pi.on("session_compact", async (event: any) => {
    lastSummary = event.compactionEntry?.summary ?? lastSummary;
    current = null;
    pendingCompaction = false;
  });

  // A: the hook. Every turn, silently, then the agent hears nothing or a tier.
  pi.on("turn_end", async (event: any, ctx: any) => {
    turn++;
    try {
      await evaluate(ctx, event, "turn_end");
    } catch (err: any) {
      report(pi, "error", { hook: "turn_end", message: err?.message ?? String(err) });
    }
  });

  // The tier message rides on the next LLM call as a transient message. Silent injects nothing.
  pi.on("context", async (event: any) => {
    const messages = event.messages.filter((m: any) => !(m.role === "custom" && m.customType === GUIDANCE));
    if (current?.message) {
      messages.push({ role: "custom", customType: GUIDANCE, content: current.message, display: false, timestamp: Date.now() });
    }
    return { messages };
  });

  // B: the same decision, on demand.
  pi.registerTool({
    name: "should_i_compact",
    label: "Should I compact",
    description:
      "Ask whether now is a good moment to compact the conversation. Returns should_compact, a tier " +
      "(silent, notice, recommend, request), the reason, and the current context percent. Cheap, call it freely.",
    parameters: Type.Object({}),
    async execute(_id: string, _params: any, _signal: AbortSignal, _onUpdate: any, ctx: any) {
      try {
        const last = { message: { content: [] }, toolResults: [] };
        const r = await evaluate(ctx, last, "should_i_compact");
        const empty = { switched_gears: { type: "noul", noul: 0 }, at_boundary: { type: "noul", noul: 0 }, needs_history: { type: "score", score: 2 }, mid_operation: { type: "noul", noul: 0 } } as unknown as CompactAnswers;
        const verdict = compactVerdict(r.decision, r.answers ?? empty, r.usage, lines);
        return { content: [{ type: "text", text: JSON.stringify(verdict, null, 2) }], details: verdict };
      } catch (err: any) {
        return { content: [{ type: "text", text: `should_i_compact error: ${err?.message ?? err}` }], isError: true };
      }
    },
  });

  // The action. The note rides into the compaction instructions so it survives the summary.
  pi.registerTool({
    name: "compact_now",
    label: "Compact now",
    description:
      "Compact the conversation now. Pass a short note_to_self: what you were doing, what is done, what is next. " +
      "The note is kept in the summary so you can pick up where you left off.",
    parameters: Type.Object({ note_to_self: Type.String({ description: "Two to five lines: state of the work, next step." }) }),
    async execute(_id: string, params: any, _signal: AbortSignal, _onUpdate: any, ctx: any) {
      const usage = usageOf(ctx);
      report(pi, "compact", { note: params.note_to_self, usage });
      current = null;
      pendingCompaction = true;
      ctx.compact({
        customInstructions: `Keep this note from the agent verbatim at the top of the summary:\n${params.note_to_self}`,
        onComplete: () => report(pi, "compact-done", { usage: usageOf(ctx) }),
        onError: (error: any) => { pendingCompaction = false; report(pi, "error", { hook: "compact_now", message: error?.message ?? String(error) }); },
      });
      return { content: [{ type: "text", text: "Compaction started. Your note will lead the summary. Continue with the current request." }] };
    },
  });

  // C: which turn starts the live work. Folded into the compaction instructions.
  pi.on("session_before_compact", async (event: any, ctx: any) => {
    try {
      const turns: TurnSummary[] = userMessages.map((m, i) => ({ index: i, request: clip(m, 120) }));
      if (turns.length < 2) return;
      const { answers } = await decide(pi, "session_before_compact", { turns }, cutPointQuestion(turns), { context: usageOf(ctx) });
      const cut = cutPointInstructions(turns, answers.live_from as any);
      report(pi, "hook", { hook: "session_before_compact", liveFrom: cut.liveFrom, confidence: cut.confidence, instructions: cut.instructions });
      // Instructions only. pi still writes the summary; the pick tells it what to keep in detail.
      if (event.customInstructions !== undefined) event.customInstructions = `${event.customInstructions ?? ""}\n${cut.instructions}`.trim();
    } catch (err: any) {
      report(pi, "error", { hook: "session_before_compact", message: err?.message ?? String(err) });
    }
  });
}
