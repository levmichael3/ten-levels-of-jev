/**
 * Level 8 extension: cheap reads. Three tools, one file each, flat parameters.
 *
 *   ask_jev_file_bool(path, question, yes?, no?)
 *   ask_jev_file_choice(path, question, options)
 *   ask_jev_file_score(path, question, levels)
 *
 * Code reads the file and sends it to Jev as `content`. The agent gets a typed answer and never
 * the file. Load: pi -e extensions/ask-jev-file.ts --tools read,bash,ask_jev_file_bool,ask_jev_file_choice,ask_jev_file_score
 */
import { Type } from "typebox";
import { decide } from "./report.ts";
import { askFileBool, askFileChoice, askFileScore, FileStateError } from "../src/levels/level08/index.ts";

const WHEN =
  "Use this for a judgment about what a file does or contains, without reading it into your context. " +
  "Write the question against `content`, which is the file's text. Use the read tool instead when you need the code itself, to edit or quote it. " +
  "Exact lookups, does this string appear, how many lines, belong to grep, not here.";

const ok = (payload: unknown) => ({ content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], details: payload });
const fail = (err: any) => ({ content: [{ type: "text", text: err instanceof FileStateError ? err.message : `error: ${err?.message ?? err}` }], isError: true });

export default function (pi: any) {
  pi.registerTool({
    name: "ask_jev_file_bool",
    label: "Ask Jev about a file, yes or no",
    description: `Yes or no about one file. Returns { path, answer, noul } where noul is the probability of yes, 0 to 1. ${WHEN}`,
    parameters: Type.Object({
      path: Type.String({ description: "File path, relative to the repo" }),
      question: Type.String({ description: "A yes or no question about `content`, for example: Does `content` validate authentication tokens?" }),
      yes: Type.Optional(Type.String({ description: "What counts as yes" })),
      no: Type.Optional(Type.String({ description: "What counts as no" })),
    }),
    async execute(_id: string, p: any, _signal: AbortSignal, _u: any, ctx: any) {
      try {
        return ok(await askFileBool(p.path, p.question, ctx.cwd, { yes: p.yes, no: p.no }, (s, q) => decide(pi, "ask_jev_file_bool", s, q, { path: p.path })));
      } catch (err) { return fail(err); }
    },
  });

  pi.registerTool({
    name: "ask_jev_file_choice",
    label: "Ask Jev about a file, pick one",
    description: `Pick one option about one file. Returns { path, choice, confidence, probabilities }. The choice is always one of your options; an "other" option is added if you leave none. ${WHEN}`,
    parameters: Type.Object({
      path: Type.String({ description: "File path, relative to the repo" }),
      question: Type.String({ description: "The question, for example: Which layer is `content`?" }),
      options: Type.Record(Type.String(), Type.String(), { description: "Option name to a one line description of when it applies. Up to 255." }),
    }),
    async execute(_id: string, p: any, _signal: AbortSignal, _u: any, ctx: any) {
      try {
        return ok(await askFileChoice(p.path, p.question, p.options, ctx.cwd, (s, q) => decide(pi, "ask_jev_file_choice", s, q, { path: p.path })));
      } catch (err) { return fail(err); }
    },
  });

  pi.registerTool({
    name: "ask_jev_file_score",
    label: "Ask Jev about a file, on a scale",
    description: `A position on a scale you define, about one file. Returns { path, score, top, nearest, confidence, legend }. Levels are ordered low to high, two to ten of them, each a described situation. ${WHEN}`,
    parameters: Type.Object({
      path: Type.String({ description: "File path, relative to the repo" }),
      question: Type.String({ description: "The question, for example: How risky is a refactor of `content`?" }),
      levels: Type.Array(Type.String(), { description: "Ordered low to high, each level a situation, for example: Isolated and well tested" }),
    }),
    async execute(_id: string, p: any, _signal: AbortSignal, _u: any, ctx: any) {
      try {
        return ok(await askFileScore(p.path, p.question, p.levels, ctx.cwd, (s, q) => decide(pi, "ask_jev_file_score", s, q, { path: p.path })));
      } catch (err) { return fail(err); }
    },
  });
}
