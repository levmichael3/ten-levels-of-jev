/**
 * DevOps Level 10, option B: cross-repo pull request synthesis.
 * Agent working across repos uses Jev to judge API/Helm/Terraform synchronization.
 */
import { jev } from "../../core/client.ts";
import { noul, choice } from "../../core/helpers.ts";
import type { NoulAnswer, ChoiceAnswer } from "../../core/types.ts";

export type SyncStatus = "synchronized" | "api_mismatch" | "helm_drift" | "terraform_drift";

export type PRSyncResult = {
  status: SyncStatus;
  confidence: number;
  action: string;
};

/** B: verify cross-repo synchronization. */
export async function verifyPRSync(apiDiff: string, helmDiff: string, tfDiff: string): Promise<PRSyncResult> {
  const { answers } = await jev.systemOne({ api: apiDiff.slice(0, 800), helm: helmDiff.slice(0, 800), tf: tfDiff.slice(0, 800) }, {
    api_helm_sync: noul("Does the Helm values file reference the correct API version and endpoints from the API spec change?"),
    api_tf_sync: noul("Does the Terraform infrastructure match the new API requirements (ports, endpoints, secrets)?"),
    overall: choice("What is the overall synchronization status?", {
      synchronized: "API, Helm, and Terraform are all aligned",
      api_mismatch: "API spec changed but Helm or Terraform not updated",
      helm_drift: "Helm values drift from API spec or Terraform state",
      terraform_drift: "Terraform infrastructure does not match new API or Helm requirements",
    }),
  });

  const overall = answers.overall as ChoiceAnswer;

  const action = overall.choice === "synchronized"
    ? "All repos aligned, proceed with merge"
    : overall.choice === "api_mismatch"
    ? "Update Helm values and Terraform to match new API spec"
    : overall.choice === "helm_drift"
    ? "Sync Helm values with API spec and verify Terraform compatibility"
    : "Update Terraform infrastructure to match new API and Helm requirements";

  return {
    status: overall.choice as SyncStatus,
    confidence: overall.confidence,
    action,
  };
}
