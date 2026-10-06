import { jev } from '../core/client';

/**
 * Level 1: Destructive CLI Command Gate
 * Decision: Should this command be allowed? (Noul - probabilistic yes/no)
 */
export async function checkDestructiveCommand(command: string, resourceType: 'ephemeral' | 'production') {
  const result = await jev.systemOne(
    { command, resourceType },
    {
      allow: {
        type: "noul",
        instructions: `Is the command "${command}" safe for a ${resourceType} resource?`,
      },
    }
  );
  return result.answers.allow.noul;
}

/**
 * Level 2: CI/CD Runner Allocation
 * Decision: Classify workload for runner allocation (Choice)
 */
export async function classifyRunner(dockerfileContent: string) {
  const result = await jev.systemOne(
    { dockerfileContent },
    {
        runner: {
        type: "choice",
        instructions: "Classify this workload for CI runner allocation",
        criteria: { build_cpu_heavy: "CPU Intensive", e2e_gpu_required: "GPU Required", lightweight_lint: "Lint", other: "Other" },
      },

    }
  );
  return result.answers.runner.choice;
}

/**
 * Level 3: ArgoCD Sync Risk Score
 * Decision: Score deployment risk (Score)
 */
export async function scoreArgoRisk(namespace: string, diffDelta: number) {
  const result = await jev.systemOne(
    { namespace, diffDelta },
    {
      risk: {
        type: "score",
        instructions: `Score the risk for ArgoCD sync in ${namespace} with delta ${diffDelta}`,
        criteria: ["low", "medium", "high"],
      },
    }
  );
  return result.answers.risk.score;
}

/**
 * Level 4: Automated ArgoCD Sync Gate (Confidence)
 * Decision: Evaluate sync action based on confidence
 */
export async function evaluateArgoSync(action: string, context: string) {
  const result = await jev.systemOne(
    { action, context },
    {
      sync: {
        type: "noul",
        question: `Should we auto-sync ArgoCD application with action "${action}"? Context: ${context}`,
      },
    }
  );
  return result.answers.sync.noul;
}

/**
 * Level 5: Debug Assistant Router
 * Decision: Route debug task (Choice)
 */
export async function routeDebugTask(task: string) {
  const result = await jev.systemOne(
    { task },
    {
      route: {
        type: "choice",
        question: `Route debug task: "${task}"`,
        criteria: ['simple_k8s_lookup', 'terraform_syntax_fix', 'multi_repo_architecture_failure', 'other'],
      },
    }
  );
  return result.answers.route.choice;
}

/**
 * Level 6: Agent K8s Gate Hook
 * Decision: Filter dangerous k8s tool calls (Noul/Choice)
 */
export async function filterK8sCommand(command: string) {
  const result = await jev.systemOne(
    { command },
    {
      safe: {
        type: "noul",
        question: `Is the k8s command "${command}" safe for an agent?`,
      },
    }
  );
  return result.answers.safe.noul;
}

/**
 * Level 7: CI/CD Log Truncator
 * Decision: Truncate logs (Noul/Choice)
 */
export async function truncateLog(logChunk: string) {
  const result = await jev.systemOne(
    { logChunk },
    {
      relevant: {
        type: "noul",
        question: `Is this log chunk "${logChunk.substring(0, 50)}..." relevant to the failure?`,
      },
    }
  );
  return result.answers.relevant.noul;
}

/**
 * Level 8: Ask Jev Manifest Security
 * Decision: Check security compliance of manifest (Choice)
 */
export async function checkManifestSecurity(manifest: string) {
  const result = await jev.systemOne(
    { manifest },
    {
      security: {
        type: "choice",
        question: "Does this manifest meet security standards?",
        criteria: ['compliant', 'unsafe_run_as_root', 'missing_limits', 'other'],
      },
    }
  );
  return result.answers.security.choice;
}

/**
 * Level 9: Fleet-Wide Security Scanner
 * Decision: Scan repo for security (Noul/Choice)
 */
export async function scanRepoSecurity(repoPath: string) {
  const result = await jev.systemOne(
    { repoPath },
    {
      status: {
        type: "choice",
        question: `Security status for ${repoPath}`,
        criteria: ['action_required', 'patched', 'not_applicable'],
      },
    }
  );
  return result.answers.status.choice;
}

/**
 * Level 10: Automated Incident Remediation Loop
 * Decision: Remediation strategy (Choice)
 */
export async function suggestRemediation(incidentDetails: string) {
  const result = await jev.systemOne(
    { incidentDetails },
    {
      strategy: {
        type: "choice",
        question: `Suggested remediation for: ${incidentDetails}`,
        criteria: ['restart_deployment', 'scale_pods', 'verify_db_credentials', 'other'],
      },
    }
  );
  return result.answers.strategy.choice;
}
