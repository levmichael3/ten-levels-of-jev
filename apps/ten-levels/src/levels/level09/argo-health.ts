/**
 * DevOps Level 9, option B: ArgoCD application health sweep.
 * Scan all ArgoCD application manifests to identify misconfigured sync policies or missing health checks.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";

export type HealthStatus = "healthy" | "missing_checks" | "misconfigured";

export type ArgoHealthResult = {
  app: string;
  status: HealthStatus;
  confidence: number;
};

/** B: classify one ArgoCD app's health configuration. */
export async function scanArgoHealth(app: string, manifest: string): Promise<ArgoHealthResult> {
  const { answers } = await jev.systemOne({ app, manifest: manifest.slice(0, 1000) }, {
    has_health: noul("Does this application define health checks, readiness probes, or liveness probes?"),
    sync_policy: choice("What is the sync policy configuration?", {
      healthy: "Automated sync with prune disabled, retry enabled, and health checks defined",
      missing_checks: "Sync enabled but missing health checks or resource health validation",
      misconfigured: "Prune enabled without approval, auto-sync to production, or missing resource quotas",
    }),
  });

  const sync = answers.sync_policy as ChoiceAnswer;

  return {
    app,
    status: sync.choice as HealthStatus,
    confidence: sync.confidence,
  };
}
