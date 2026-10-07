/**
 * Run one level or one option from the terminal:
 *   node src/level.ts 4      Level 4, all three options
 *   node src/level.ts 4 b    Level 4, option B only
 * Prints every request, typed answer, latency, and decision.
 *
 * Live through LiteLLM when LITELLM_API_KEY is set; JEV_BACKEND=mock forces the
 * offline mock. `just jev4` and `just jev4b` wrap this.
 */
// The demo opts into mock only when no LiteLLM key exists. Otherwise the
// shared client uses LiteLLM, once on construction.
if (!process.env.JEV_BACKEND && !process.env.LITELLM_API_KEY?.trim()) {
  process.env.JEV_BACKEND = "mock";
}

import { fileURLToPath } from "node:url";
import { jev } from "./core/client.ts";
import type { Answer } from "./core/types.ts";
import * as l1 from "./levels/level01/index.ts";
import * as l2 from "./levels/level02/index.ts";
import * as l3 from "./levels/level03/index.ts";
import * as l4 from "./levels/level04/index.ts";
import * as l5 from "./levels/level05/index.ts";
import * as l6 from "./levels/level06/index.ts";
import * as l7 from "./levels/level07/index.ts";
import * as l8 from "./levels/level08/index.ts";
import * as l9 from "./levels/level09/index.ts";
import * as l10 from "./levels/level10/index.ts";

const MINT = "\x1b[38;2;128;255;228m";
const MAGENTA = "\x1b[38;2;249;53;248m";
const DIM = "\x1b[90m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

const log = (s = "") => console.log(s);
const head = (n: number, title: string, sub: string) => {
  log(`${BOLD}${MINT}DevOps LEVEL ${n}  ${title}${RESET}`);
  log(`${DIM}${sub}${RESET}`);
};

/** Compact one-line rendering of a typed answer. */
function answerLine(id: string, a: Answer): string {
  if (a.type === "noul") return `${id}: noul ${a.noul.toFixed(2)}`;
  if (a.type === "choice") return `${id}: ${a.choice} (confidence ${a.confidence.toFixed(2)})`;
  return `${id}: score ${a.score.toFixed(2)} of ${Object.keys(a.legend).length - 1} (confidence ${a.confidence.toFixed(2)})`;
}

type Option = { key: "A" | "B" | "C"; name: string; input: string; run: () => Promise<unknown> };
type Level = { title: string; sub: string; options: Option[] };
const opt = (key: Option["key"], name: string, input: string, run: () => Promise<unknown>): Option => ({ key, name, input, run });

const SANDBOX = fileURLToPath(new URL("../sandbox/", import.meta.url));

const LEVELS: Record<number, Level> = {
  1: {
    title: "Smart Infra Gate",
    sub: "One judgment before every kubectl, gcloud, or aws command. Production or ephemeral? Destructive or safe?",
    options: [
      opt("A", "Destructive CLI gate", "kubectl delete pvc data-postgres-0 -n production",
        () => l1.destructiveCLIGate("kubectl delete pvc data-postgres-0 -n production", "production cluster, customer DB")),
      opt("B", "PR fast-track gate", "README.md, docs/API.md — docs update",
        () => l1.prFastTrackGate(["README.md", "docs/API.md"], "docs: update API documentation and examples")),
      opt("C", "Incident pager gate", "CPU > 90% on prod-api-03 for 5 minutes",
        () => l1.incidentPagerGate("CPU usage > 90% for 5 minutes on prod-api-03", "Prometheus")),
    ],
  },
  2: {
    title: "Pipeline & Incident Routing",
    sub: "Classify infra state and route to the correct controller, queue, or runbook.",
    options: [
      opt("A", "Runner allocation", "Multi-stage Docker build with PyTorch CUDA",
        () => l2.allocateRunner("+ src/ml/inference.py: PyTorch model loading, CUDA kernels", "FROM nvidia/cuda:11.8-runtime-ubuntu22.04...")),
      opt("B", "Change classifier", "OAuth2 login with Google and GitHub",
        () => l2.classifyChange("feat: add OAuth2 login with Google and GitHub providers", ["src/auth/oauth.ts", "src/db/migrations/005_oauth.sql", "tests/auth/oauth.test.ts"])),
      opt("C", "Alert triage", "api-gateway CrashLoopBackOff OOMKilled in production",
        () => l2.triageAlert("api-gateway-7d9f4b8c5-x2v4m", "CrashLoopBackOff: container exiting with code 137 (OOMKilled)", "production")),
    ],
  },
  3: {
    title: "Deployment Risk & PR Health",
    sub: "Score several infrastructure metrics with Jev and weigh them programmatically in code.",
    options: [
      opt("A", "ArgoCD risk score", "production-payments: timeout increase during peak hours",
        () => l3.argocdRiskScore("production-payments", "+ 3 files: update payment gateway timeout from 30s to 60s, add retry logic", "Tuesday 14:00 UTC (peak hours)")),
      opt("B", "Cluster upgrade score", "prod-worker-pool: 50 pods, 12 stateful, PDBs allow 30%",
        () => l3.clusterUpgradeScore("prod-worker-pool", "50 pods, 12 stateful (Redis, Postgres), PDBs allow 30% disruption")),
      opt("C", "Dependency drift", "shared-helm-chart: Aurora Serverless v2 migration, 12 consumers",
        () => l3.dependencyDrift("terraform-aws-module", "Major: replace RDS module with Aurora Serverless v2", 12)),
    ],
  },
  4: {
    title: "Safeguarding Automation",
    sub: "High-blast-radius actions run automatically ONLY when confidence exceeds safe thresholds.",
    options: [
      opt("A", "ArgoCD sync gate", "payments-api: circuit breaker to production",
        () => l4.gateArgoSync("payments-api", "+ 2 files: increase timeout, add circuit breaker", "production")),
      opt("B", "Resource cleanup gate", "preview-env-pr-1042: last accessed 2024-01-15",
        () => l4.gateResourceCleanup("preview-env-pr-1042", "2024-01-15", "ephemeral namespace")),
      opt("C", "Rollback trigger", "payments-api: 15% error rate, 4500ms P95 latency",
        () => l4.triggerRollback("payments-api", 0.15, 0.002, 4500)),
    ],
  },
  5: {
    title: "Cost & Latency Optimization",
    sub: "Use Jev to evaluate incoming DevOps tasks in milliseconds and pick the cheapest tool/agent.",
    options: [
      opt("A", "Debug router", "api-gateway CrashLoopBackOff in production",
        () => l5.routeDebug("Pod api-gateway-7d9f4b8c5-x2v4m is CrashLoopBackOff in production", "production namespace, customer-facing API")),
      opt("B", "Terraform router", "RDS instance class change",
        () => l5.routeTerraform("+ variables.tf: add new RDS instance class", ["variables.tf", "main.tf", "outputs.tf"])),
      opt("C", "Log analysis router", "api-gateway logs with timeout errors",
        () => l5.routeLogAnalysis("api-gateway", "2024-01-20T10:15:30Z GET /health 200 2ms\n2024-01-20T10:15:31Z GET /api/v1/users 500 4500ms error: timeout", true)),
    ],
  },
  6: {
    title: "In-Agent Policy Enforcement",
    sub: "Embed Jev into agent hooks to keep DevOps agents safe in real time. The agent never sees the check.",
    options: [
      opt("A", "K8s gate", "kubectl apply -f payments-deployment.yaml -n production",
        () => l6.gateK8SCommand("kubectl apply -f payments-deployment.yaml -n production", "production", [])),
      opt("B", "Write guard", ".github/workflows/deploy.yml — shared CI workflow",
        () => l6.guardFileWrite(".github/workflows/deploy.yml", "name: Deploy\n...", "/repo")),
      opt("C", "Secret screen", "kubectl get secret db-credentials -o yaml",
        () => l6.screenCommandOutput("apiVersion: v1\nkind: Secret\ndata:\n  password: redacted-demo-value", "kubectl get secret db-credentials -o yaml")),
    ],
  },
  7: {
    title: "Large Log & Spec Truncation",
    sub: "Intelligently trim massive K8s manifests, build logs, and pod descriptions before passing to agents.",
    options: [
      opt("A", "Log truncator", "logs/ci-build.log, 100 lines, keep the webhook timeout",
        () => {
          return Promise.resolve(l7.decideLogChunk({
            has_error: { type: "noul", noul: 0.95 },
            is_context: { type: "noul", noul: 0.8 },
            relevance: { type: "score", score: 3, top: 3, nearest: "Critical", confidence: 0.9, legend: {} },
          }));
        }),
      opt("B", "Manifest summarizer", "kubectl get pod -o yaml, strip runtime noise",
        () => {
          const section = "status:\n  phase: Running\n  conditions:\n    - type: Ready\n      status: 'False'\n      reason: ContainersNotReady";
          return Promise.resolve(l7.decideManifestSection({
            is_runtime_noise: { type: "noul", noul: 0.2 },
            is_failing: { type: "noul", noul: 0.9 },
            importance: { type: "score", score: 3, top: 3, nearest: "Critical", confidence: 0.95, legend: {} },
          }));
        }),
      opt("C", "Diff pruner", "Cross-repo API contract changes, keep proto files only",
        () => {
          const diff = "diff --git a/api.proto b/api.proto\n+service PaymentService {";
          return Promise.resolve(l7.decideDiffChunk({
            is_lockfile: { type: "noul", noul: 0.1 },
            is_structural: { type: "noul", noul: 0.95 },
            importance: { type: "score", score: 3, top: 3, nearest: "Critical", confidence: 0.92, legend: {} },
          }));
        }),
    ],
  },
  8: {
    title: "Cheap File & Manifest Queries",
    sub: "Ask questions about K8s manifests, Dockerfiles, or Terraform code without sending full files.",
    options: [
      opt("A", "ask_jev_manifest_security", "payments deployment: runs as root? lacks limits?",
        () => l8.askManifestSecurity("apiVersion: apps/v1\nkind: Deployment\nspec:\n  template:\n    spec:\n      containers:\n        - name: payments\n          securityContext:\n            runAsUser: 0")),
      opt("B", "ask_jev_dockerfile_best_practice", "service Dockerfile: pinned tags? multi-stage?",
        () => l8.askDockerfileBestPractice("FROM node:18-alpine AS builder\n...\nFROM node:18-alpine")),
      opt("C", "ask_jev_ci_compliance", "deploy workflow: pinned actions? approval gates?",
        () => l8.askCICompliance("name: Deploy\nuses: actions/checkout@v4\nuses: aws-actions/configure-aws-credentials@v2")),
    ],
  },
  9: {
    title: "Cross-Repo Analysis at Scale",
    sub: "Fan out parallel Jev requests across tens or hundreds of repositories simultaneously.",
    options: [
      opt("A", "Fleet security scan", "45 repos: outdated dependencies, vulnerable base images",
        () => l9.scanRepoSecurity("payments-service", "FROM node:16-alpine", "require('lodash@4.17.20')", "{\"dependencies\":{\"lodash\":\"^4.17.20\"}}")),
      opt("B", "ArgoCD health sweep", "All apps: misconfigured sync policies, missing health checks",
        () => l9.scanArgoHealth("payments-api", "syncPolicy:\n  automated:\n    prune: true\n    selfHeal: true")),
      opt("C", "Terraform drift detection", "30 environments: state vs config mismatch",
        () => l9.detectTerraformDrift("production-us-east", "Plan: 1 to add, 2 to change, 0 to destroy")),
    ],
  },
  10: {
    title: "Fully Agentic DevOps Jev",
    sub: "Give autonomous DevOps agents a dedicated ask_jev tool so they can self-evaluate during complex infrastructure operations.",
    options: [
      opt("A", "Incident remediation", "api-gateway CrashLoopBackOff: diagnose from logs",
        () => l10.diagnoseIncident("Container started\nListening on port 8080\nError: connection refused to database\nRetrying...\nFATAL: password authentication failed", "Pod: api-gateway-xxx\nEvents: Back-off restarting failed container")),
      opt("B", "PR synthesis", "API + Helm + Terraform: verify synchronization",
        () => l10.verifyPRSync("+service PaymentService { rpc Charge }", "paymentService:\n  enabled: true\n  replicaCount: 3", "resource \"aws_lb\" \"payments\" {}")),
      opt("C", "Canary evaluator", "payments v2.1.0: 450ms P95, 0.15% error rate vs baseline",
        () => l10.evaluateCanary("v2.1.0", 450, 0.15, 380, 0.02)),
    ],
  },

};

async function main() {
  const n = Number(process.argv[2]);
  const level = LEVELS[n];
  const which = (process.argv[3] ?? "").toUpperCase();
  if (!level || (which && !["A", "B", "C"].includes(which))) {
    console.error(`usage: node src/level.ts <1..10> [a|b|c]`);
    process.exit(2);
  }
  const options = which ? level.options.filter((o) => o.key === which) : level.options;
  const verbose = process.argv.includes("--wire");
  jev.on((e) => {
    if (e.kind === "request") {
      log(`${DIM}request:${RESET} ${Object.keys(e.questions).length} question(s) to ${e.model}`);
      if (verbose) log(`${DIM}${JSON.stringify(e.state).slice(0, 300)}${RESET}`);
    }
    if (e.kind === "response") {
      for (const [id, a] of Object.entries(e.result.answers)) log(`  ${MINT}${answerLine(id, a)}${RESET}`);
      log(`${DIM}${e.result.meta.elapsedMs} ms, ${e.result.model}${RESET}`);
    }
  });

  head(n, level.title, level.sub);
  log(`${DIM}backend: ${jev.isLive ? `live (${jev.provider})` : "mock (deterministic)"}${RESET}`);
  const started = performance.now();
  for (const o of options) {
    log(`\n${MAGENTA}${o.key}  ${o.name}${RESET}`);
    log(`${DIM}input:${RESET} ${o.input}`);
    log(`${DIM}decision:${RESET} ${JSON.stringify(await o.run())}`);
  }
  log(`\n${DIM}${jev.calls} Jev call(s), ${Math.round(performance.now() - started)} ms total${RESET}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
