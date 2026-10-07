/**
 * DevOps Level 8, option C: ask_jev_ci_compliance.
 * Check if a GitHub Actions workflow complies with organization pipeline security policies.
 */
import { jev } from "../../core/client.ts";
import { noul } from "../../core/helpers.ts";
import type { NoulAnswer } from "../../core/types.ts";

export type CICompliance = {
  usesPinnedActions: boolean;
  hasApprovalGates: boolean;
  noSecretsInEnv: boolean;
  confidence: number;
};

/** C: compliance judgment on a CI workflow without reading the full file. */
export async function askCICompliance(workflowSnippet: string): Promise<CICompliance> {
  const { answers } = await jev.systemOne({ workflow: workflowSnippet }, {
    pinned_actions: noul("Does this workflow pin all third-party GitHub Actions to specific commit SHAs or tagged versions (not @main or @master)?"),
    approval_gates: noul("Does this workflow require manual approval for production deployments or privileged operations?"),
    no_secrets: noul("Does this workflow avoid hardcoding secrets, tokens, or credentials in environment variables or scripts?"),
  });

  const pinned = answers.pinned_actions as NoulAnswer;
  const approval = answers.approval_gates as NoulAnswer;
  const secrets = answers.no_secrets as NoulAnswer;

  return {
    usesPinnedActions: pinned.noul > 0.5,
    hasApprovalGates: approval.noul > 0.5,
    noSecretsInEnv: secrets.noul > 0.5,
    confidence: Math.max(pinned.noul, approval.noul, secrets.noul),
  };
}
