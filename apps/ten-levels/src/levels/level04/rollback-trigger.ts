/**
 * DevOps Level 4, option C: automated rollback trigger.
 * Evaluate post-deployment error rate spikes vs. normal deployment metrics.
 */
import { jev } from "../../core/client.ts";
import { noul, score } from "../../core/helpers.ts";
import type { NoulAnswer, ScoreAnswer } from "../../core/types.ts";
import { CONFIDENCE } from "./confidence.ts";

export type RollbackDecision = {
  action: "rollback" | "monitor" | "ignore";
  confidence: number;
  reason: string;
};

/** C: trigger automated rollback based on confidence. */
export async function triggerRollback(serviceName: string, errorRate: number, baselineRate: number, latencyP95: number): Promise<RollbackDecision> {
  const { answers } = await jev.systemOne({
    service: serviceName,
    errorRate: errorRate.toString(),
    baseline: baselineRate.toString(),
    latency: latencyP95.toString(),
  }, {
    error_spike: noul("Is the error rate more than 3x the baseline and trending upward?"),
    latency_spike: noul("Is the P95 latency more than 2x the baseline and climbing?"),
    severity: score("How severe is the degradation?", [
      "Within normal variance",
      "Elevated but service is functional",
      "Service degraded, some customers affected",
      "Service down or critical functionality broken",
    ]),
  });

  const errorSpike = answers.error_spike as NoulAnswer;
  const latencySpike = answers.latency_spike as NoulAnswer;
  const severity = answers.severity as ScoreAnswer;

  const confidence = Math.max(errorSpike.noul, latencySpike.noul) * (severity.score / 3);

  if (confidence > CONFIDENCE.DESTRUCTIVE_BAR) {
    return { action: "rollback", confidence, reason: `High confidence ${confidence.toFixed(2)}: critical degradation detected` };
  }
  if (confidence > CONFIDENCE.REVIEW_FLOOR) {
    return { action: "monitor", confidence, reason: `Medium confidence ${confidence.toFixed(2)}: elevated errors, monitoring closely` };
  }
  return { action: "ignore", confidence, reason: `Low confidence ${confidence.toFixed(2)}: within normal variance` };
}
