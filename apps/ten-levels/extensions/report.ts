/**
 * The side channel every agent level extension reports on.
 *
 * One JSON line per event on stderr, prefixed `JEV_EVENT`, which the lab's session manager
 * folds into the window's stream in real time. The same payload is appended to the pi
 * session as a custom entry, so the session file holds the permanent record.
 *
 * `decide` is the one way an extension calls Jev: it validates, calls, reports, and returns.
 * `extra` must not use the keys the report already sets: source, state, questions, answers, usage, model, ms.
 */
import { JevClient } from "../src/core/client.ts";
import { validateQuestions, type Answer, type Questions, type State } from "../src/core/types.ts";

let client: JevClient | undefined;
export const jev = () => (client ??= new JevClient({ provider: "litellm" }));

/** The level config the lab passed in, JEV_LEVEL_CONFIG as JSON. */
export function levelConfig<T extends object>(fallback: T): T {
  try {
    const raw = process.env.JEV_LEVEL_CONFIG;
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

export function report(pi: any, kind: string, payload: Record<string, unknown>): void {
  const body = { kind, at: Date.now(), ...payload };
  process.stderr.write("JEV_EVENT " + JSON.stringify(body) + "\n");
  try { pi.appendEntry?.(`jev-${kind}`, payload); } catch { /* entries are optional */ }
}

export interface Decision {
  answers: Record<string, Answer>;
  usage: { input_tokens: number; output_tokens: number; cost?: number };
  model: string;
  ms: number;
}

/**
 * One Jev call from inside the harness. `source` names who asked, a hook or a tool, so the
 * window can label the row. The full state, questions, and answers travel on the side channel.
 */
export async function decide(pi: any, source: string, state: State, questions: Questions, extra: Record<string, unknown> = {}): Promise<Decision> {
  validateQuestions(questions);
  const started = performance.now();
  const result = await jev().systemOne(state, questions);
  const out: Decision = { answers: result.answers, usage: result.usage, model: result.model, ms: Math.round(performance.now() - started) };
  report(pi, "jev", { source, state, questions, answers: out.answers, usage: out.usage, model: out.model, ms: out.ms, ...extra });
  return out;
}
