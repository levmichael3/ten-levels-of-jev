/**
 * DevOps Level 10, option A: automated incident remediation loop.
 * Agent fixing CrashLoopBackOff runs ask_jev on pod logs and cluster events.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";

export type IncidentRootCause =
  | "db_connection_timeout"
  | "oom_killed"
  | "image_pull_error"
  | "config_error"
  | "unknown";

export type IncidentRemediation = {
  rootCause: IncidentRootCause;
  confidence: number;
  nextAction: string;
};

/** A: diagnose incident from pod logs and events. */
export async function diagnoseIncident(podLogs: string, events: string): Promise<IncidentRemediation> {
  const { answers } = await jev.systemOne({ logs: podLogs.slice(0, 2000), events: events.slice(0, 1000) }, {
    root_cause: choice("What is the root cause of this incident?", {
      db_connection_timeout: "Database connection timeouts, pool exhaustion, or SQL errors",
      oom_killed: "Out of memory killed, heap errors, or resource limits exceeded",
      image_pull_error: "Failed to pull image, registry errors, or invalid image tags",
      config_error: "Missing config map, wrong environment variables, or invalid secrets",
      unknown: "No clear pattern, needs deeper investigation or human SRE",
    }),
    resolved: noul("Did the last action (restart, scale, config change) resolve the incident?"),
  });

  const rootCause = answers.root_cause as ChoiceAnswer;
  const resolved = answers.resolved as NoulAnswer;

  const nextAction = resolved.noul > 0.7
    ? "Incident resolved, monitor for recurrence"
    : rootCause.choice === "db_connection_timeout"
    ? "Verify DB security groups, connection pool settings, and secret keys"
    : rootCause.choice === "oom_killed"
    ? "Increase memory limits, optimize heap usage, or scale horizontally"
    : rootCause.choice === "image_pull_error"
    ? "Check registry credentials, image tags, and network policies"
    : rootCause.choice === "config_error"
    ? "Validate config maps, secrets, and environment variables"
    : "Escalate to human SRE for deeper investigation";

  return {
    rootCause: rootCause.choice as IncidentRootCause,
    confidence: rootCause.confidence,
    nextAction,
  };
}
