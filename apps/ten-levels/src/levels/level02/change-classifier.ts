/**
 * DevOps Level 2, option B: multi-repo change classifier.
 * When a core shared library changes, classify affected downstream repositories.
 */
import { jev } from "../../core/client.ts";
import { choice } from "../../core/helpers.ts";
import type { ChoiceAnswer } from "../../core/types.ts";

export type ChangeImpact = "breaking_api_change" | "minor_feature_flagged" | "non_functional_docs" | "other";

export type ChangeClassification = {
  impact: ChangeImpact;
  confidence: number;
};

/** B: what kind of downstream impact does this change have? */
export async function classifyChange(commitMessage: string, changedFiles: string[]): Promise<ChangeClassification> {
  const { answers } = await jev.systemOne({ commit: commitMessage, files: changedFiles.join("\n") }, {
    impact: choice("What is the downstream impact of this change?", {
      breaking_api_change: "Changes public API signatures, removes endpoints, or alters contract behavior",
      minor_feature_flagged: "New feature behind flag, additive change, or backward-compatible enhancement",
      non_functional_docs: "Documentation, README, comments, or test-only changes with no runtime effect",
      other: "Dependency bumps, config changes, or internal refactoring with no API impact",
    }),
  });

  const impact = answers.impact as ChoiceAnswer;
  return {
    impact: impact.choice as ChangeImpact,
    confidence: impact.confidence,
  };
}
