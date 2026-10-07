/**
 * DevOps Level 4, option B: automated cloud resource cleanup gate.
 * Decommission stale cloud resources / ephemeral preview environments. Low confidence triggers notification instead of deletion.
 */
import { jev } from "../../core/client.ts";
import { noul, choice } from "../../core/helpers.ts";
import type { NoulAnswer, ChoiceAnswer } from "../../core/types.ts";
import { CONFIDENCE } from "./confidence.ts";

export type CleanupDecision = {
  action: "delete" | "notify" | "preserve";
  confidence: number;
  reason: string;
};

/** B: gate cloud resource cleanup based on confidence. */
export async function gateResourceCleanup(resourceId: string, lastAccessed: string, resourceType: string): Promise<CleanupDecision> {
  const { answers } = await jev.systemOne({ resource: resourceId, lastAccess: lastAccessed, type: resourceType }, {
    is_stale: noul("Has this resource been unused for more than 30 days with no scheduled jobs or dependencies?"),
    has_backups: noul("Are there verified backups or snapshots of this resource before deletion?"),
    risk: choice("What is the blast radius if this resource is deleted incorrectly?", {
      low: "Ephemeral preview env, temporary storage, or sandbox resource",
      medium: "Shared dev environment or non-critical service",
      high: "Production data store, load balancer, or critical infrastructure",
    }),
  });

  const stale = answers.is_stale as NoulAnswer;
  const backups = answers.has_backups as NoulAnswer;
  const risk = answers.risk as ChoiceAnswer;

  const confidence = stale.noul * backups.noul * risk.confidence;

  if (confidence > CONFIDENCE.DESTRUCTIVE_BAR) {
    return { action: "delete", confidence, reason: `High confidence ${confidence.toFixed(2)}: stale, backed up, low risk` };
  }
  if (confidence > CONFIDENCE.REVIEW_FLOOR) {
    return { action: "notify", confidence, reason: `Medium confidence ${confidence.toFixed(2)}: notify owner before deletion` };
  }
  return { action: "preserve", confidence, reason: `Low confidence ${confidence.toFixed(2)}: preserve and flag for review` };
}
