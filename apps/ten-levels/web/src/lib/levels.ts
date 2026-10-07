/** Static level metadata the pages render before any API call. */
export interface LevelMeta {
  n: number;
  title: string;
  /** One description, always opening with "Use This For:" and when to reach for this level. */
  sub: string;
}

export const USE_LABEL = "Use This For:";

/** The description split at the label so the page can color it: [before, after]. */
export function splitUse(sub: string): [string, string] {
  const i = sub.indexOf(USE_LABEL);
  return i < 0 ? [sub, ""] : [sub.slice(0, i), sub.slice(i + USE_LABEL.length)];
}

export const LEVELS: LevelMeta[] = [
  { n: 1, title: "Smart Infra Gate", sub: "Use This For: a yes or no before every kubectl, gcloud, or aws command. Is this targeting production or ephemeral? Destructive or safe? The smart, cheap, fast if statement." },
  { n: 2, title: "Pipeline & Incident Routing", sub: "Use This For: categorizing infra state and routing to the correct controller, queue, or runbook. One call, many classifications." },
  { n: 3, title: "Deployment Risk & PR Health", sub: "Use This For: grading infrastructure risk on a scale you define. One Score per factor, and the weights that combine them live in code, so tuning means changing a number, not a prompt." },
  { n: 4, title: "Safeguarding Automation", sub: "Use This For: high-blast-radius actions where a wrong answer costs more than asking a human. The answer says what, confidence says whether: confident runs, unsure confirms, low goes to a person." },
  { n: 5, title: "Cost & Latency Optimization", sub: "Use This For: one cheap decision in front of expensive things, where most DevOps tasks do not need the big model, the deep agent, or a human SRE." },
  { n: 6, title: "In-Agent Policy Enforcement", sub: "Use This For: checking every tool call before it runs, where the agent never sees the check. kubectl, helm, file writes, and command outputs, one hook each." },
  { n: 7, title: "Large Log & Spec Truncation", sub: "Use This For: telling an agent when its context has moved on. Numbers in code, judgment in Jev. The agent drops noise, keeps signals, and highlights critical sections." },
  { n: 8, title: "Cheap File & Manifest Queries", sub: "Use This For: a judgment about a K8s manifest, Dockerfile, or CI workflow without reading the full file into context. Three tools, one question each, and the file never comes back." },
  { n: 9, title: "Cross-Repo Analysis at Scale", sub: "Use This For: asking the same questions of many repositories in parallel, without reading all of them, and letting code cut the list based on severity." },
  { n: 10, title: "Fully Agentic DevOps Jev", sub: "Use This For: letting your agent decide on its own when to use Jev during complex infrastructure operations. One ask_jev tool, a nudge in the system prompt, and the agent reaches for a typed decision whenever one beats reasoning." },
];

/** One sentence per use case, shown on the selectable cards. */
export const USE_CASES: Record<number, [string, string][]> = {
  1: [
    ["Destructive CLI gate", "One Noul in front of every kubectl command: is this targeting production or ephemeral? Destructive or safe?"],
    ["PR fast-track gate", "One Noul and one Choice: does this PR need the full 45-minute E2E matrix or a fast unit test pipeline?"],
    ["Incident pager gate", "One Noul and one Score: does this alert require waking an on-call engineer or can it group into an async digest?"],
  ],
  2: [
    ["Runner allocation", "One Choice: classify pipeline workloads by resource demands. CPU-heavy build, GPU E2E, or lightweight lint?"],
    ["Change classifier", "One Choice: when a core shared library changes, classify downstream impact. Breaking, minor, or docs-only?"],
    ["Alert triage", "One Choice and one Noul: route unhandled K8s events to the owning team. Platform, data, frontend, secops, or SRE?"],
  ],
  3: [
    ["ArgoCD risk score", "Criticality 0.5, complexity 0.3, traffic 0.2. Weights an SRE can read in one line. Auto-sync, canary, or block."],
    ["Cluster upgrade score", "Stateful pods 0.4, PDB headroom 0.35, drain risk 0.25. Grade node pool upgrades before scheduling maintenance."],
    ["Dependency drift", "Blast radius 0.4, change type 0.4, test coverage 0.2. Score downstream impact of shared Helm or Terraform changes."],
  ],
  4: [
    ["ArgoCD sync gate", "High confidence (> 0.95): auto-sync staging. Medium (0.50-0.95): post diff for approval. Low (< 0.50): block and demand SRE review."],
    ["Resource cleanup gate", "Decommission stale preview environments. High confidence deletes, medium notifies, low preserves."],
    ["Rollback trigger", "Post-deployment error rate spikes vs. baseline. High confidence triggers instant automated rollback without human intervention."],
  ],
  5: [
    ["Debug router", "Which tool handles the task: kubectl lookup, fast LLM for Terraform syntax, or deep agent for cross-service failure?"],
    ["Terraform router", "Does this PR need a full terraform plan in remote backend (expensive, slow) vs. local static analysis (fast, cheap)?"],
    ["Log analysis router", "Route log dumps to automated regex parsing vs. LLM anomaly detection based on Jev log pattern classification."],
  ],
  6: [
    ["K8s gate", "Before any kubectl command runs: read only, reversible, or irreversible? Targets production without bypass tag? Blocked. The agent sees only the reason."],
    ["Write guard", "Paths outside the repo block in code. Inside, Jev asks whether the file or its content holds a credential or touches shared infrastructure."],
    ["Secret screen", "After a read or a command, before the model sees it: does the output contain raw secrets, credentials, or production connection strings? Flagged output gets a banner."],
  ],
  7: [
    ["Log truncator", "Four questions after every chunk: is this an error? Is this context? How relevant? The agent drops noise, keeps signals, highlights critical."],
    ["Manifest summarizer", "Strip runtime status noise, managed fields, and standard annotations from kubectl get pod -o yaml, retaining only failing container specs and events."],
    ["Diff pruner", "When fixing an inter-service bug across 5 repositories, evaluate file diffs and keep only structural API changes, discarding lockfiles and asset updates."],
  ],
  8: [
    ["ask_jev_manifest_security", "One file, three yes/no questions. Does this K8s deployment run as root? Lack resource limits? Expose sensitive data? The agent never sees the full manifest."],
    ["ask_jev_dockerfile_best_practice", "One file, three yes/no questions. Pinned base image tags? Multi-stage builds? Minimal final image? The agent never reads the Dockerfile."],
    ["ask_jev_ci_compliance", "One file, three yes/no questions. Pinned third-party actions? Approval gates for production? No hardcoded secrets? The agent never reads the workflow."],
  ],
  9: [
    ["Fleet security scan", "Raw Jev question JSON, one call per repo, all in parallel. Classify each repo as action_required, patched, or not_applicable based on Dockerfile and dependencies."],
    ["ArgoCD health sweep", "Code expands the app list, drops healthy apps, and caps at 255 before any call. Scan all ArgoCD applications for misconfigured sync policies."],
    ["Terraform drift detection", "Every environment answers, then code buckets drift severity. Query terraform plan output across 30 cloud environments simultaneously."],
  ],
  10: [
    ["Incident remediation", "The agent fixing a CrashLoopBackOff runs ask_jev on pod logs and cluster events, gets a typed root cause classification, and switches strategy automatically."],
    ["PR synthesis", "An agent working across API service, Helm chart repo, and Terraform repo uses Jev after every iteration to verify cross-repo synchronization."],
    ["Canary evaluator", "An agent managing an Argo Rollout queries Jev during canary phases with Prometheus metric snapshots and promotes or rolls back based on SLO evaluation."],
  ],
};
