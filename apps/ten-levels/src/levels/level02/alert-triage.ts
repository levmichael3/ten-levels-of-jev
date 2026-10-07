/**
 * DevOps Level 2, option C: alert triage and owner routing.
 * Route unhandled K8s events directly to the owning team.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";

export type OwnerTeam = "platform_core" | "data_pipeline" | "frontend_edge" | "secops" | "sre";

export type AlertTriage = {
  team: OwnerTeam;
  needsImmediateAttention: boolean;
  confidence: number;
};

/** C: which team owns this alert? */
export async function triageAlert(podName: string, event: string, namespace: string): Promise<AlertTriage> {
  const { answers } = await jev.systemOne({ pod: podName, event, namespace }, {
    owner: choice("Which team owns this workload?", {
      platform_core: "Backend services, APIs, databases, or core platform infrastructure",
      data_pipeline: "ETL jobs, stream processing, data warehouses, or analytics workloads",
      frontend_edge: "CDN, edge functions, web apps, or customer-facing UI services",
      secops: "Security alerts, policy violations, or access control issues",
      sre: "Infrastructure, networking, cluster health, or observability tooling",
    }),
    critical: noul("Is this a CrashLoopBackOff, OOMKilled, or repeated restart affecting customer traffic?"),
  });

  const owner = answers.owner as ChoiceAnswer;
  const critical = answers.critical as NoulAnswer;

  return {
    team: owner.choice as OwnerTeam,
    needsImmediateAttention: critical.noul > 0.7,
    confidence: owner.confidence,
  };
}
