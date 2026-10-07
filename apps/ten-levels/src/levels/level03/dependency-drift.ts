/**
 * DevOps Level 3, option C: cross-repo dependency drift score.
 * Score downstream impact when bumping shared Helm charts or Terraform modules.
 */
import { jev } from "../../core/client.ts";
import { score } from "../../core/helpers.ts";
import type { ScoreAnswer } from "../../core/types.ts";

export const DRIFT_QUESTIONS = {
  blast_radius: score("How many repositories consume this shared component?", [
    "1-5 repos, tightly controlled",
    "6-20 repos, some divergence",
    "21-50 repos, significant drift",
    "50+ repos or monorepo with many consumers",
  ]),
  change_type: score("What kind of change is being introduced?", [
    "Patch: bug fix, security patch, no API change",
    "Minor: new feature, backward-compatible",
    "Major: breaking change, new required fields",
    "Structural: rewrite, new paradigm, or module replacement",
  ]),
  test_coverage: score("What is the automated test coverage across consumers?", [
    "High: integration tests in most repos",
    "Medium: unit tests, some integration",
    "Low: minimal tests, manual validation",
    "Unknown: no test visibility",
  ]),
};

export const DRIFT_WEIGHTS = { blast_radius: 0.4, change_type: 0.4, test_coverage: 0.2 };

export type DependencyDrift = {
  score: number;
  action: "auto_merge" | "canary" | "kill_and_replan";
  parts: Record<string, number>;
};

/** C: score dependency drift risk. */
export async function dependencyDrift(component: string, changeSummary: string, consumerCount: number): Promise<DependencyDrift> {
  const { answers } = await jev.systemOne({ component, change: changeSummary, consumers: consumerCount.toString() }, DRIFT_QUESTIONS);

  const blast = answers.blast_radius as ScoreAnswer;
  const change = answers.change_type as ScoreAnswer;
  const test = answers.test_coverage as ScoreAnswer;

  const parts = {
    blast_radius: blast.score / 3,
    change_type: change.score / 3,
    test_coverage: test.score / 3,
  };

  const weighted =
    parts.blast_radius * DRIFT_WEIGHTS.blast_radius +
    parts.change_type * DRIFT_WEIGHTS.change_type +
    parts.test_coverage * DRIFT_WEIGHTS.test_coverage;

  const action = weighted > 0.7 ? "kill_and_replan" : weighted > 0.4 ? "canary" : "auto_merge";

  return { score: weighted, action, parts };
}
