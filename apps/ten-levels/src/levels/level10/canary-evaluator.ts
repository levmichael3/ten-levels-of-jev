/**
 * DevOps Level 10, option C: ArgoCD progressive canary evaluator.
 * Agent managing Argo Rollout queries Jev during canary phases with Prometheus metrics.
 */
import { jev } from "../../core/client.ts";
import { noul, score } from "../../core/helpers.ts";
import type { NoulAnswer, ScoreAnswer } from "../../core/types.ts";

export type CanaryDecision = "promote" | "hold" | "rollback";

export type CanaryEvaluation = {
  decision: CanaryDecision;
  confidence: number;
  reason: string;
};

/** C: evaluate canary metrics and decide next step. */
export async function evaluateCanary(version: string, latencyP95: number, errorRate: number, baselineLatency: number, baselineError: number): Promise<CanaryEvaluation> {
  const { answers } = await jev.systemOne({
    version,
    latency: latencyP95.toString(),
    errorRate: errorRate.toString(),
    baselineLatency: baselineLatency.toString(),
    baselineError: baselineError.toString(),
  }, {
    latency_acceptable: noul("Is the P95 latency within 1.2x of the baseline?"),
    error_acceptable: noul("Is the error rate within 1.5x of the baseline and below 0.1%?"),
    severity: score("How severe is the canary degradation?", [
      "No degradation, metrics match or improve on baseline",
      "Minor degradation, still within SLO bounds",
      "Moderate degradation, approaching SLO limits",
      "Severe degradation, exceeding SLO or customer-impacting",
    ]),
  });

  const latencyOK = answers.latency_acceptable as NoulAnswer;
  const errorOK = answers.error_acceptable as NoulAnswer;
  const severity = answers.severity as ScoreAnswer;

  const decision: CanaryDecision =
    latencyOK.noul > 0.7 && errorOK.noul > 0.7 && severity.score <= 1
      ? "promote"
      : severity.score >= 3
      ? "rollback"
      : "hold";

  const reason =
    decision === "promote"
      ? `Latency ${latencyP95}ms vs baseline ${baselineLatency}ms, error ${errorRate}% vs ${baselineError}% — within bounds`
      : decision === "rollback"
      ? `Severity ${severity.score}/3: latency or error exceeds safe thresholds`
      : `Monitoring: latency ${latencyOK.noul.toFixed(2)}, error ${errorOK.noul.toFixed(2)} — holding for more data`;

  return {
    decision,
    confidence: Math.min(latencyOK.noul, errorOK.noul),
    reason,
  };
}
