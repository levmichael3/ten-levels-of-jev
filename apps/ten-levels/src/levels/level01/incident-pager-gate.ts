/**
 * DevOps Level 1, option C: incident pager gate.
 * One Noul on every PagerDuty / Prometheus alert: wake the on-call engineer or group into async digest?
 */
import { jev } from "../../core/client.ts";
import { noul, score } from "../../core/helpers.ts";
import type { NoulAnswer, ScoreAnswer } from "../../core/types.ts";

export type PagerDecision = {
  wakeEngineer: boolean;
  urgency: number;
  reason: string;
};

/** C: does this alert need immediate human attention? */
export async function incidentPagerGate(alert: string, source: string): Promise<PagerDecision> {
  const { answers } = await jev.systemOne({ alert, source }, {
    customer_impact: noul("Is this alert affecting live customer traffic, transactions, or data availability?"),
    auto_remediation_possible: noul("Can this alert be auto-remediated by existing runbooks, auto-scaling, or self-healing?"),
    severity: score("How severe is this alert?", [
      "Informational; no service impact",
      "Degraded; workarounds exist, partial impact",
      "Critical; service down, data loss, or security incident",
    ]),
  });

  const customerImpact = answers.customer_impact as NoulAnswer;
  const autoHeal = answers.auto_remediation_possible as NoulAnswer;
  const severity = answers.severity as ScoreAnswer;

  const wakeEngineer = customerImpact.noul > 0.85 && autoHeal.noul < 0.5;
  return {
    wakeEngineer,
    urgency: severity.score / 2,
    reason: wakeEngineer
      ? `Customer impact ${customerImpact.noul.toFixed(2)}, auto-heal unlikely ${autoHeal.noul.toFixed(2)}`
      : `Auto-heal possible ${autoHeal.noul.toFixed(2)} or low customer impact ${customerImpact.noul.toFixed(2)}`,
  };
}
