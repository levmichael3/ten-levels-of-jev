/**
 * DevOps Level 3, option A: ArgoCD / GitOps sync risk score.
 * Combine sub-scores for namespace criticality, diff delta complexity, and peak traffic window.
 */
import { jev } from "../../core/client.ts";
import { score } from "../../core/helpers.ts";
import type { ScoreAnswer } from "../../core/types.ts";

export const ARGORISK_QUESTIONS = {
  criticality: score("How critical is the target namespace?", [
    "Dev or ephemeral environment",
    "Staging or pre-production",
    "Production customer-facing services",
    "Production core platform or payment flows",
  ]),
  complexity: score("How complex is the diff delta?", [
    "Single file, few lines, no dependencies",
    "Multiple files, standard changes, some dependencies",
    "Broad changes, many dependencies, or infrastructure modifications",
    "Architecture change, breaking API, or database migration",
  ]),
  traffic: score("What is the current traffic window risk?", [
    "Low traffic, off-peak hours",
    "Moderate traffic, business hours",
    "High traffic, peak hours",
    "Critical window (launch, blackout, revenue event)",
  ]),
};

export const ARGO_WEIGHTS = { criticality: 0.5, complexity: 0.3, traffic: 0.2 };

export type ArgoRisk = {
  score: number;
  action: "auto_sync" | "canary" | "block";
  parts: Record<string, number>;
};

/** A: compute ArgoCD sync risk score. */
export async function argocdRiskScore(namespace: string, diffSummary: string, timeWindow: string): Promise<ArgoRisk> {
  const { answers } = await jev.systemOne({ namespace, diff: diffSummary, time: timeWindow }, ARGORISK_QUESTIONS);

  const criticality = answers.criticality as ScoreAnswer;
  const complexity = answers.complexity as ScoreAnswer;
  const traffic = answers.traffic as ScoreAnswer;

  const parts = {
    criticality: criticality.score / 3,
    complexity: complexity.score / 3,
    traffic: traffic.score / 3,
  };

  const weighted =
    parts.criticality * ARGO_WEIGHTS.criticality +
    parts.complexity * ARGO_WEIGHTS.complexity +
    parts.traffic * ARGO_WEIGHTS.traffic;

  const action = weighted > 0.7 ? "canary" : weighted > 0.4 ? "auto_sync" : "block";

  return { score: weighted, action, parts };
}
