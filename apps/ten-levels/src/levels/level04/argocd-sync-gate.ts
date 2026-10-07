/**
 * DevOps Level 4, option A: automated ArgoCD auto-sync gate.
 * High confidence (> 0.95): auto-sync staging. Medium (0.50-0.95): post diff for approval. Low (< 0.50): block and demand human SRE review.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";
import { CONFIDENCE } from "./confidence.ts";

export type SyncDecision = {
  action: "auto_sync" | "approve_required" | "block";
  confidence: number;
  reason: string;
};

/** A: gate ArgoCD sync based on confidence. */
export async function gateArgoSync(appName: string, diffSummary: string, targetEnv: string): Promise<SyncDecision> {
  const { answers } = await jev.systemOne({ app: appName, diff: diffSummary, env: targetEnv }, {
    risk: choice("What is the risk level of syncing this application?", {
      low: "Non-critical microservice, staging, or dev environment",
      medium: "Production service with good test coverage and no stateful data",
      high: "Critical production service, stateful, or financial impact",
    }),
    has_tests: noul("Does this change have passing tests in CI?"),
    reviewed: noul("Has this change been through code review and approval?"),
  });

  const risk = answers.risk as ChoiceAnswer;
  const hasTests = answers.has_tests as NoulAnswer;
  const reviewed = answers.reviewed as NoulAnswer;

  const baseConfidence = risk.confidence;
  const confidence = baseConfidence * (hasTests.noul > 0.5 ? 1.0 : 0.7) * (reviewed.noul > 0.5 ? 1.0 : 0.8);

  if (confidence > CONFIDENCE.DESTRUCTIVE_BAR) {
    return { action: "auto_sync", confidence, reason: `High confidence ${confidence.toFixed(2)} with tests and review` };
  }
  if (confidence > CONFIDENCE.REVIEW_FLOOR) {
    return { action: "approve_required", confidence, reason: `Medium confidence ${confidence.toFixed(2)}: post diff for 1-click approval` };
  }
  return { action: "block", confidence, reason: `Low confidence ${confidence.toFixed(2)}: demand human SRE review` };
}
