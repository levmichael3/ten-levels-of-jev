/**
 * DevOps Level 6, option B: cross-repo file write guard.
 * Prevent autonomous agents from modifying files outside designated scope.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";

export const FILE_WRITE_QUESTIONS = {
  path_risk: choice("What kind of path is the agent trying to write to?", {
    safe: "Inside the designated service directory, test files, or documentation",
    shared: "Shared CI workflow, root Terraform module, or cross-repo configuration",
    critical: "Production secret store, authentication config, or infrastructure state",
  }),
  contains_secret: noul("Does the file content appear to contain credentials, tokens, or connection strings?"),
};

export interface WriteGuardAnswers {
  path_risk: ChoiceAnswer;
  contains_secret: NoulAnswer;
}

export interface WriteGuardDecision {
  block: boolean;
  reason: string;
}

/** Block or allow file writes. */
export function guardWrite(a: WriteGuardAnswers): WriteGuardDecision {
  if (a.path_risk.choice === "critical") {
    return { block: true, reason: `Blocked write to critical path: ${a.path_risk.choice}` };
  }
  if (a.path_risk.choice === "shared" && a.path_risk.confidence > 0.7) {
    return { block: true, reason: `Blocked write to shared resource without explicit approval` };
  }
  if (a.contains_secret.noul > 0.7) {
    return { block: true, reason: `Blocked: file appears to contain secrets or credentials` };
  }
  return { block: false, reason: `Allowed: safe path, no secrets detected` };
}

/** B: full async guard with Jev call. */
export async function guardFileWrite(filePath: string, content: string, repoScope: string): Promise<WriteGuardDecision> {
  const { answers } = await jev.systemOne({ path: filePath, content: content.slice(0, 500), scope: repoScope }, FILE_WRITE_QUESTIONS);
  return guardWrite({
    path_risk: answers.path_risk as ChoiceAnswer,
    contains_secret: answers.contains_secret as NoulAnswer,
  });
}
