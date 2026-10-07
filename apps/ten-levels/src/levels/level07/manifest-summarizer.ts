/**
 * DevOps Level 7, option B: Kubernetes manifest summarizer.
 * Compact massive kubectl get pod -o yaml outputs by stripping runtime noise, keeping failing specs.
 */
import { noul, score } from "../../core/helpers.ts";
import type { NoulAnswer, ScoreAnswer } from "../../core/types.ts";

export interface ManifestSectionState {
  section: string;
  sectionType: string;
  podStatus?: string;
}

export const MANIFEST_SUMMARIZE_QUESTIONS = {
  is_runtime_noise: noul("Is this section runtime-generated noise (managedFields, status, timestamps, or node info)?"),
  is_failing: noul("Does this section describe a failing container, crash, or error condition?"),
  importance: score("How important is this section for debugging the pod issue?", [
    "Noise: metadata.uid, creationTimestamp, or managedFields",
    "Context: labels, annotations, or node assignment",
    "Signal: container specs, resource limits, or environment variables",
    "Critical: failing container status, exit codes, or events",
  ]),
};

export interface ManifestSummarizeAnswers {
  is_runtime_noise: NoulAnswer;
  is_failing: NoulAnswer;
  importance: ScoreAnswer;
}

export type ManifestKeepDecision = "drop" | "keep" | "highlight";

export function decideManifestSection(a: ManifestSummarizeAnswers): ManifestKeepDecision {
  if (a.is_failing.noul > 0.7 || a.importance.score >= 3) return "highlight";
  if (a.is_runtime_noise.noul > 0.7) return "drop";
  if (a.importance.score >= 2) return "keep";
  return "drop";
}
