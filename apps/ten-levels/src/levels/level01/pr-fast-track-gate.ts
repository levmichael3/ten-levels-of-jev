/**
 * DevOps Level 1, option B: flaky test / PR fast-track gate.
 * One Noul decides if a PR needs the full 45-minute E2E matrix or a fast unit test pipeline.
 */
import { jev } from "../../core/client.ts";
import { noul, choice } from "../../core/helpers.ts";
import type { NoulAnswer, ChoiceAnswer } from "../../core/types.ts";

export type PRFastTrack = {
  fastTrack: boolean;
  pipeline: "unit_only" | "full_matrix";
  confidence: number;
};

/** B: does this PR justify the fast track? */
export async function prFastTrackGate(filesChanged: string[], commitMessage: string): Promise<PRFastTrack> {
  const { answers } = await jev.systemOne({ files: filesChanged.join("\n"), commit: commitMessage }, {
    touches_critical: noul("Do the changed files touch production infrastructure, authentication, payment flows, or data migrations?"),
    is_docs_or_test: noul("Are the changes limited to documentation, comments, test-only files, or README updates?"),
    risk_profile: choice("What is the risk profile of these changes?", {
      low: "README, comments, test data, or non-production config",
      medium: "Feature code with tests, no infra or auth changes",
      high: "Auth, billing, infra, migrations, or untested core logic",
    }),
  });

  const critical = answers.touches_critical as NoulAnswer;
  const docsOnly = answers.is_docs_or_test as NoulAnswer;
  const risk = answers.risk_profile as ChoiceAnswer;

  const fastTrack = docsOnly.noul > 0.7 || (risk.choice === "low" && critical.noul < 0.3);
  return {
    fastTrack,
    pipeline: fastTrack ? "unit_only" : "full_matrix",
    confidence: risk.confidence,
  };
}
