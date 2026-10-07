/**
 * DevOps Level 3, option B: cluster upgrade readiness score.
 * Grade node pool OS updates / K8s minor version bumps.
 */
import { jev } from "../../core/client.ts";
import { score } from "../../core/helpers.ts";
import type { ScoreAnswer } from "../../core/types.ts";

export const UPGRADE_QUESTIONS = {
  stateful_pods: score("How many stateful pods are on the nodes to be upgraded?", [
    "None; all workloads are stateless",
    "Few stateful pods with local backups",
    "Many stateful pods, some without PDB",
    "Critical stateful services with tight SLAs",
  ]),
  pdb_headroom: score("What is the PodDisruptionBudget headroom?", [
    "Healthy PDBs allow 50%+ disruption",
    "PDBs allow 20-50% disruption",
    "PDBs allow <20% disruption",
    "No PDBs or PDBs block all disruption",
  ]),
  drain_risk: score("How risky is the drain timeout scenario?", [
    "Fast drain, no long-running jobs",
    "Some jobs need graceful termination",
    "Long-running batch jobs or ML training",
    "Critical jobs that cannot be interrupted",
  ]),
};

export const UPGRADE_WEIGHTS = { stateful_pods: 0.4, pdb_headroom: 0.35, drain_risk: 0.25 };

export type UpgradeReadiness = {
  score: number;
  action: "proceed" | "canary_upgrade" | "defer";
  parts: Record<string, number>;
};

/** B: compute cluster upgrade readiness score. */
export async function clusterUpgradeScore(nodePool: string, workloadSummary: string): Promise<UpgradeReadiness> {
  const { answers } = await jev.systemOne({ nodePool, workloads: workloadSummary }, UPGRADE_QUESTIONS);

  const stateful = answers.stateful_pods as ScoreAnswer;
  const pdb = answers.pdb_headroom as ScoreAnswer;
  const drain = answers.drain_risk as ScoreAnswer;

  const parts = {
    stateful_pods: stateful.score / 3,
    pdb_headroom: pdb.score / 3,
    drain_risk: drain.score / 3,
  };

  const weighted =
    parts.stateful_pods * UPGRADE_WEIGHTS.stateful_pods +
    parts.pdb_headroom * UPGRADE_WEIGHTS.pdb_headroom +
    parts.drain_risk * UPGRADE_WEIGHTS.drain_risk;

  const action = weighted > 0.7 ? "defer" : weighted > 0.4 ? "canary_upgrade" : "proceed";

  return { score: weighted, action, parts };
}
