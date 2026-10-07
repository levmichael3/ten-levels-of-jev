/**
 * DevOps Level 7, option C: multi-repo git diff pruner.
 * Evaluate file diffs and keep only structural API changes, discarding lockfiles and asset updates.
 */
import { noul, score } from "../../core/helpers.ts";
import type { NoulAnswer, ScoreAnswer } from "../../core/types.ts";

export interface DiffChunkState {
  filePath: string;
  diffChunk: string;
  repo: string;
}

export const DIFF_PRUNE_QUESTIONS = {
  is_lockfile: noul("Is this file a lockfile, generated asset, or binary (package-lock.json, yarn.lock, go.sum, image files)?"),
  is_structural: noul("Does this diff change API signatures, function contracts, or data models?"),
  importance: score("How important is this diff for understanding the cross-repo impact?", [
    "Noise: formatting, comments, or generated code",
    "Context: test updates, config changes, or dependency bumps",
    "Signal: API changes, interface modifications, or schema updates",
    "Critical: breaking changes, security fixes, or contract rewrites",
  ]),
};

export interface DiffPruneAnswers {
  is_lockfile: NoulAnswer;
  is_structural: NoulAnswer;
  importance: ScoreAnswer;
}

export type DiffKeepDecision = "drop" | "keep" | "highlight";

export function decideDiffChunk(a: DiffPruneAnswers): DiffKeepDecision {
  if (a.is_lockfile.noul > 0.7) return "drop";
  if (a.is_structural.noul > 0.7 || a.importance.score >= 3) return "highlight";
  if (a.importance.score >= 2) return "keep";
  return "drop";
}
