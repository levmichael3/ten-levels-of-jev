/**
 * Level 10 extension: ask_jev on any situation.
 *
 * One tool. The agent passes its own state, paths for code to read, a command for code to run,
 * and its question block. Code assembles one state and makes one call. A command runs through
 * the Level 6 bash gate first. Over the budget, the error names the parts and a split that fits.
 * Every call lands in a spend ledger reported at the end of each agent run.
 * Load: pi -e extensions/ask-jev.ts --tools read,bash,edit,write,ask_jev
 */
import { exec } from "node:child_process";
import { Type } from "typebox";
import { decide, report } from "./report.ts";
import { BLOCK_NOTICE, gateBashCommand } from "../src/levels/level06/index.ts";
import {
  ASK_JEV_DESCRIPTION, AskStateError, assembleState, emptyLedger, parseQuestions, record, summarize, type CommandOutput,
} from "../src/levels/level10/index.ts";

const NUDGE =
  "You have ask_jev. When you need a classification, a risk score, or a yes or no with a confidence, " +
  "prefer it over reasoning it out yourself. Give it paths or a command instead of pasting content. " +
  "It answers in 300 ms and costs almost nothing.";

const COMMAND_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_CHARS = 200_000;

const ok = (payload: unknown) => ({ content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], details: payload });

/** Run a command for the state. The output is captured, never streamed to the agent. */
function runCommand(command: string, cwd: string): Promise<CommandOutput> {
  return new Promise((resolve) => {
    exec(command, { cwd, timeout: COMMAND_TIMEOUT_MS, maxBuffer: MAX_OUTPUT_CHARS * 4, env: { ...process.env, CI: "1" } }, (err, stdout, stderr) => {
      const code = err && typeof (err as any).code === "number" ? (err as any).code : err ? null : 0;
      resolve({ command, exit_code: code, stdout: String(stdout).slice(0, MAX_OUTPUT_CHARS), stderr: String(stderr).slice(0, MAX_OUTPUT_CHARS) });
    });
  });
}

export default function (pi: any) {
  let ledger = emptyLedger();

  pi.on("before_agent_start", async (event: any) => {
    const systemPrompt = event.systemPrompt ?? "";
    if (systemPrompt.includes("ask_jev")) return;
    return { systemPrompt: `${systemPrompt}\n\n${NUDGE}` };
  });

  pi.registerTool({
    name: "ask_jev",
    label: "Ask Jev",
    description: ASK_JEV_DESCRIPTION,
    parameters: Type.Object({
      questions_json: Type.String({ description: "The question block, a JSON object keyed by question id" }),
      state: Type.Optional(Type.String({ description: "Your own state: plain text, or a JSON object as a string. Short. Not for pasting files or output." })),
      paths: Type.Optional(Type.Array(Type.String(), { description: "Files or globs for code to read into files[\"path\"]. Up to 20 files." })),
      command: Type.Optional(Type.String({ description: "A command for code to run in the repo; its result goes into output. Runs through the bash gate." })),
    }),
    async execute(_id: string, p: any, _signal: AbortSignal, _u: any, ctx: any) {
      try {
        const questions = parseQuestions(p.questions_json);
        const run = async (command: string, cwd: string) => {
          const gate = await gateBashCommand(command, cwd, (s, q) => decide(pi, "ask_jev command gate", s, q));
          report(pi, "hook", { hook: "ask_jev command", tool: "bash", command, block: gate.block, reason: gate.reason });
          if (gate.block) throw new AskStateError(`ask_jev: the command was refused by the bash gate: ${gate.reason}. ${BLOCK_NOTICE} ask_jev commands should only read.`);
          return runCommand(command, cwd);
        };
        const { state, summary } = await assembleState({ state: p.state, paths: p.paths, command: p.command }, ctx.cwd, run);
        const result = await decide(pi, "ask_jev", state, questions, { summary });
        ledger = record(ledger, result.usage as any, Object.keys(result.answers).length);
        return ok({ answers: result.answers, state_summary: summary, usage: result.usage, model: result.model });
      } catch (err: any) {
        const text = err instanceof AskStateError ? err.message : `ask_jev error: ${err?.message ?? err}`;
        report(pi, "error", { hook: "ask_jev", message: text });
        return { content: [{ type: "text", text }], isError: true };
      }
    },
  });

  pi.on("agent_end", async () => {
    if (ledger.calls) report(pi, "ledger", { ...ledger, summary: summarize(ledger, 0) });
  });
}
