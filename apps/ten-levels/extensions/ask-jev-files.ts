/**
 * Level 9 extension: files at scale.
 *
 *   ask_jev_files(paths_or_globs, questions_json, recursive?)   one call per file, in parallel, answers per path
 *   pick_first_file(question, paths)                             a second pass: which of these to open first
 *
 * The question schema rides in the description, since this is where the agent starts writing
 * Jev's JSON itself. Load: pi -e extensions/ask-jev-files.ts --tools read,bash,ask_jev_files,pick_first_file
 */
import { Type } from "typebox";
import { decide } from "./report.ts";
import { askFiles, pickFirstFile } from "../src/levels/level09/index.ts";

export const QUESTION_SCHEMA =
  'questions_json is a JSON object keyed by question id. Three types. ' +
  'noul: {"type":"noul","instructions":"Does `content` ...?","criteria":{"true":"...","false":"..."}} returns a probability of yes. ' +
  'choice: {"type":"choice","instructions":"Which ... is `content`?","criteria":{"option_a":"when it applies","option_b":"...","other":"none of the above"}} returns one of your keys plus confidence, up to 255 options. ' +
  'score: {"type":"score","instructions":"How ... is `content`?","criteria":["lowest situation","...","highest situation"]} returns a position on your levels, two to ten of them. ' +
  "Write every question against `content`, the file's text; `path` is also in the state. Ask every question you might need in one block, it is one call per file either way.";

const ok = (payload: unknown) => ({ content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], details: payload });
const fail = (err: any) => ({ content: [{ type: "text", text: `error: ${err?.message ?? err}` }], isError: true });

export default function (pi: any) {
  pi.registerTool({
    name: "ask_jev_files",
    label: "Ask Jev about many files",
    description:
      "Ask the same typed questions of many files at once without reading any of them. Code expands globs and directories, " +
      "drops node_modules, .git, binaries, and files over the budget, caps the list at 255, then makes one Jev call per file in parallel. " +
      "Returns { results: [{ path, answers }], skipped: [{ path, reason }], calls }. " + QUESTION_SCHEMA +
      " Use read when you need a file's code; use grep for exact strings.",
    parameters: Type.Object({
      paths_or_globs: Type.Array(Type.String(), { description: 'Files, directories, or globs, relative to the repo, for example ["src/**/*.ts"] or ["src/http"]' }),
      questions_json: Type.String({ description: "The question block as a JSON string" }),
      recursive: Type.Optional(Type.Boolean({ description: "For directories: include every file below them. Default false." })),
    }),
    async execute(_id: string, p: any, _signal: AbortSignal, _u: any, ctx: any) {
      try {
        const result = await askFiles(p.paths_or_globs, p.questions_json, ctx.cwd, {
          recursive: p.recursive ?? false,
          decide: (s, q) => decide(pi, "ask_jev_files", s, q, { path: (s as any).path }),
        });
        return ok(result);
      } catch (err) { return fail(err); }
    },
  });

  pi.registerTool({
    name: "pick_first_file",
    label: "Pick the file to open first",
    description:
      "After ask_jev_files, choose which of a list of files to open first for a goal. One Choice keyed by path, so the pick is always a real file. " +
      "Returns { path | null, confidence, probabilities }. Pass a short note per path if you have one, for example the answers you already got.",
    parameters: Type.Object({
      question: Type.String({ description: "The goal, for example: Which file should I open first to fix the proration bug?" }),
      candidates: Type.Array(Type.Object({ path: Type.String(), note: Type.Optional(Type.String()) }), { description: "Paths, with an optional one line note each" }),
    }),
    async execute(_id: string, p: any) {
      try {
        return ok(await pickFirstFile(p.question, p.candidates, (s, q) => decide(pi, "pick_first_file", s, q)));
      } catch (err) { return fail(err); }
    },
  });
}
