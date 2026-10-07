/**
 * Level 6 extension: guardrail hooks. The agent never knows Jev is here.
 *
 *   tool_call    bash, before it runs: code rules, then the K8s gate or the bash gate.
 *                A failed or timed-out check blocks. It does not let the command through.
 *                write, edit: gateWriteCall, block paths outside the repo (code) and credentials (Jev)
 *                bash when C is on: secret-printing commands are blocked before they run
 *   tool_result  read, bash: screenToolResult, prepend a banner when the output carries instructions.
 *                If that screen fails, the output is withheld.
 *
 * Every decision is reported on the side channel so the lab window shows it as it happens.
 * Load: pi -e extensions/jev-guard.ts --tools read,bash,edit,write
 */
import { decide, levelConfig, report } from "./report.ts";
import { BLOCK_NOTICE, codeGateCommand, codeGateSecretCommand, gateBashCommand, gateK8SCommand, gateWriteCall, isClusterCommand, k8sNamespace, screenToolResult } from "../src/levels/level06/index.ts";

type Option = "A" | "B" | "C";

export default function (pi: any) {
  const cfg = levelConfig<{ gates: Option[] }>({ gates: ["A", "B", "C"] });
  const on = (o: Option) => cfg.gates.includes(o);

  const blocked = (tool: string, reason: string) => ({ block: true, reason: `jev-guard blocked this ${tool}: ${reason}. ${BLOCK_NOTICE}` });

  pi.on("tool_call", async (event: any, ctx: any) => {
    const tool = String(event.toolName ?? "");
    try {
      if (tool === "bash") {
        const command = String(event.input?.command ?? "");
        const secret = codeGateSecretCommand(command);
        const coded = codeGateCommand(command);
        const floor = secret ?? coded;
        if (floor?.block) {
          report(pi, "hook", { hook: "tool_call", tool: "bash", command, block: true, reason: floor.reason });
          return blocked("command", floor.reason);
        }
        if (on("A")) {
          const d = isClusterCommand(command)
            ? await gateK8SCommand(command, k8sNamespace(command), [], (s, q) => decide(pi, "tool_call bash", s, q))
            : await gateBashCommand(command, ctx.cwd, (s, q) => decide(pi, "tool_call bash", s, q));
          report(pi, "hook", { hook: "tool_call", tool: "bash", command, block: d.block, reason: d.reason });
          if (d.block) return blocked("command", d.reason);
        }
      }
      if ((tool === "write" || tool === "edit") && on("B")) {
        const path = String(event.input?.path ?? "");
        const content = String(event.input?.content ?? event.input?.newText ?? event.input?.new_string ?? "");
        const d = await gateWriteCall(path, content, ctx.cwd, (s, q) => decide(pi, `tool_call ${tool}`, s, q));
        report(pi, "hook", { hook: "tool_call", tool, path, block: d.block, reason: d.reason });
        if (d.block) return blocked(tool, d.reason);
      }
    } catch (err: any) {
      const message = err?.message ?? String(err);
      report(pi, "error", { hook: "tool_call", tool, message });
      return blocked(tool, `the check failed before it ran (${message})`);
    }
  });

  pi.on("tool_result", async (event: any) => {
    if (!on("C") || !(event.toolName === "read" || event.toolName === "bash")) return;
    try {
      const text = Array.isArray(event.content) ? event.content.filter((c: any) => c?.type === "text").map((c: any) => c.text).join("\n") : "";
      const d = await screenToolResult(event.toolName, text, (s, q) => decide(pi, `tool_result ${event.toolName}`, s, q));
      report(pi, "hook", { hook: "tool_result", tool: event.toolName, flag: d.flag, noul: d.noul, banner: d.banner });
      if (d.flag && d.banner) {
        return { content: [{ type: "text", text: `${d.banner}\n\n${text}` }] };
      }
    } catch (err: any) {
      const message = err?.message ?? String(err);
      report(pi, "error", { hook: "tool_result", message });
      return { content: [{ type: "text", text: `[jev-guard] Output withheld: the screen failed (${message}).` }] };
    }
  });
}
