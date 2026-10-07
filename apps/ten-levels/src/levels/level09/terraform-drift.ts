/**
 * DevOps Level 9, option C: multi-repo Terraform drift detection.
 * Query terraform plan output across environments to bucket drift severity.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";

export type DriftSeverity = "none" | "low" | "medium" | "high";

export type TerraformDriftResult = {
  env: string;
  severity: DriftSeverity;
  confidence: number;
};

/** C: classify one environment's Terraform drift. */
export async function detectTerraformDrift(env: string, planOutput: string): Promise<TerraformDriftResult> {
  const { answers } = await jev.systemOne({ env, plan: planOutput.slice(0, 1500) }, {
    has_drift: noul("Does this terraform plan show any changes (add, change, destroy) compared to the current state?"),
    severity: choice("What is the severity of the drift?", {
      none: "No changes detected, state matches configuration",
      low: "Tag changes, description updates, or non-functional metadata modifications",
      medium: "Resource configuration changes, scaling adjustments, or minor infrastructure updates",
      high: "Resource destruction, security group changes, or data store modifications",
    }),
  });

  const severity = answers.severity as ChoiceAnswer;

  return {
    env,
    severity: severity.choice as DriftSeverity,
    confidence: severity.confidence,
  };
}
