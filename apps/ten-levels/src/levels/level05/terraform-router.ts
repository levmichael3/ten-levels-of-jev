/**
 * DevOps Level 5, option B: Terraform speculative execution router.
 * Decide whether a PR needs full terraform plan in remote backend vs. local static analysis.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";

export type TerraformRoute = "local_static" | "remote_plan";

export type TerraformRouter = {
  route: TerraformRoute;
  confidence: number;
  reason: string;
};

/** B: route Terraform PR to local static analysis or remote plan. */
export async function routeTerraform(diffSummary: string, filesChanged: string[]): Promise<TerraformRouter> {
  const { answers } = await jev.systemOne({ diff: diffSummary, files: filesChanged.join("\n") }, {
    touches_state: noul("Does this change touch Terraform state, remote backend, or provider configuration?"),
    touches_modules: noul("Does this change modify shared modules, variables, or outputs used by other environments?"),
    risk: choice("What is the risk profile?", {
      low: "Documentation, comments, or output-only changes",
      medium: "Resource modifications with no state changes",
      high: "State migration, provider upgrade, or module rewrite",
    }),
  });

  const state = answers.touches_state as NoulAnswer;
  const modules = answers.touches_modules as NoulAnswer;
  const risk = answers.risk as ChoiceAnswer;

  const needsRemotePlan = state.noul > 0.5 || modules.noul > 0.5 || risk.choice === "high";

  return {
    route: needsRemotePlan ? "remote_plan" : "local_static",
    confidence: risk.confidence,
    reason: needsRemotePlan
      ? `Touches state/modules or high risk: ${risk.choice}`
      : `Low risk static analysis sufficient: ${risk.choice}`,
  };
}
