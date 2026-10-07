/**
 * DevOps Level 7, option A: CI/CD build log truncator.
 * Compact massive build logs by keeping only true failure stack traces and context lines.
 */
import { noul, score } from "../../core/helpers.ts";
import type { NoulAnswer, ScoreAnswer } from "../../core/types.ts";

export interface LogChunkState {
  chunk: string;
  lineStart: number;
  buildPhase: string;
}

export const LOG_TRUNCATE_QUESTIONS = {
  has_error: noul("Does this chunk contain an error, failure, or exception stack trace?"),
  is_context: noul("Does this chunk provide context immediately before or after an error (within 10 lines)?"),
  relevance: score("How relevant is this chunk to diagnosing the build failure?", [
    "Noise: timestamps, progress bars, or routine output",
    "Context: environment info, dependency versions, or configuration",
    "Signal: error message, stack trace, or assertion failure",
    "Critical: root cause, the exact line that failed, or why it failed",
  ]),
};

export interface LogTruncateAnswers {
  has_error: NoulAnswer;
  is_context: NoulAnswer;
  relevance: ScoreAnswer;
}

export type LogKeepDecision = "drop" | "keep" | "highlight";

export function decideLogChunk(a: LogTruncateAnswers): LogKeepDecision {
  if (a.has_error.noul > 0.7 || a.relevance.score >= 2) return "highlight";
  if (a.is_context.noul > 0.5 || a.relevance.score >= 1) return "keep";
  return "drop";
}
