/**
 * Runs all 10 DevOps levels against the mock backend (or the TypeSafe System One
 * API if TYPESAFE_API_KEY is set) and prints one compact table per level.
 */
import { fileURLToPath } from "node:url";
import { jev } from "./core/client.ts";
const SANDBOX = fileURLToPath(new URL("../sandbox/", import.meta.url));
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

const log = (s: string) => console.log(s);
const head = (level: string, title: string) => log(`\n\x1b[36m${level} — ${title}\x1b[0m`);
const item = (name: string, detail: unknown) =>
  log(`  \x1b[90m•\x1b[0m ${name.padEnd(28)} ${JSON.stringify(detail)}`);

async function main() {
  log(`\x1b[1m10 DevOps Levels of Jev\x1b[0m — backend: ${jev.isLive ? `LIVE (${jev.provider})` : "MOCK (deterministic)"}\n`);

  head("LEVEL 01", "Smart Infra Gate — one judgment before every CLI command");
  item("A destructiveCLIGate", await l1.destructiveCLIGate("kubectl delete pvc data-postgres-0 -n production", "production cluster, customer DB"));
  item("B prFastTrackGate", await l1.prFastTrackGate(["README.md", "docs/API.md"], "docs: update API documentation"));
  item("C incidentPagerGate", await l1.incidentPagerGate("CPU usage > 90% for 5 minutes on prod-api-03", "Prometheus"));

  head("LEVEL 02", "Pipeline & Incident Routing — classify and route");
  item("A allocateRunner", await l2.allocateRunner("+ src/ml/inference.py: PyTorch model loading, CUDA kernels", "FROM nvidia/cuda:11.8..."));
  item("B classifyChange", await l2.classifyChange("feat: add OAuth2 login", ["src/auth/oauth.ts", "src/db/migrations/005_oauth.sql"]));
  item("C triageAlert", await l2.triageAlert("api-gateway-7d9f4b8c5-x2v4m", "CrashLoopBackOff: OOMKilled", "production"));

  head("LEVEL 03", "Deployment Risk & PR Health — composite scoring");
  item("A argocdRiskScore", await l3.argocdRiskScore("production-payments", "+ timeout increase, retry logic", "Tuesday 14:00 UTC"));
  item("B clusterUpgradeScore", await l3.clusterUpgradeScore("prod-worker-pool", "50 pods, 12 stateful, PDBs allow 30%"));
  item("C dependencyDrift", await l3.dependencyDrift("terraform-aws-module", "Major: replace RDS with Aurora Serverless v2", 12));

  head("LEVEL 04", "Safeguarding Automation — confidence gating");
  item("A gateArgoSync", await l4.gateArgoSync("payments-api", "+ circuit breaker", "production"));
  item("B gateResourceCleanup", await l4.gateResourceCleanup("preview-env-pr-1042", "2024-01-15", "ephemeral namespace"));
  item("C triggerRollback", await l4.triggerRollback("payments-api", 0.15, 0.002, 4500));

  head("LEVEL 05", "Cost & Latency Optimization — route to cheapest tool");
  item("A routeDebug", await l5.routeDebug("api-gateway CrashLoopBackOff", "production namespace"));
  item("B routeTerraform", await l5.routeTerraform("+ variables.tf: add new RDS instance class", ["variables.tf", "main.tf"]));
  item("C routeLogAnalysis", await l5.routeLogAnalysis("api-gateway", "GET /api/v1/users 500 4500ms error: timeout", true));

  head("LEVEL 06", "In-Agent Policy Enforcement — guardrail hooks");
  item("A gateK8SCommand", await l6.gateK8SCommand("kubectl apply -f payments-deployment.yaml -n production", "production", []));
  item("B guardFileWrite", await l6.guardFileWrite(".github/workflows/deploy.yml", "name: Deploy\n...", "/repo"));
  item("C screenCommandOutput", await l6.screenCommandOutput("apiVersion: v1\nkind: Secret\ndata:\n  password: redacted-demo-value", "kubectl get secret"));

  head("LEVEL 07", "Large Log & Spec Truncation — intelligent compaction");
  {
    item("A decideLogChunk", l7.decideLogChunk({
      has_error: { type: "noul", noul: 0.95 },
      is_context: { type: "noul", noul: 0.8 },
      relevance: { type: "score", score: 3, top: 3, nearest: "Critical", confidence: 0.9, legend: {} },
    }));
    item("B decideManifestSection", l7.decideManifestSection({
      is_runtime_noise: { type: "noul", noul: 0.2 },
      is_failing: { type: "noul", noul: 0.9 },
      importance: { type: "score", score: 3, top: 3, nearest: "Critical", confidence: 0.95, legend: {} },
    }));
    item("C decideDiffChunk", l7.decideDiffChunk({
      is_lockfile: { type: "noul", noul: 0.1 },
      is_structural: { type: "noul", noul: 0.95 },
      importance: { type: "score", score: 3, top: 3, nearest: "Critical", confidence: 0.92, legend: {} },
    }));
  }

  head("LEVEL 08", "Cheap File & Manifest Queries — judgment without reading");
  item("A askManifestSecurity", await l8.askManifestSecurity("apiVersion: apps/v1\nkind: Deployment\nspec:\n  template:\n    spec:\n      containers:\n        - name: payments\n          securityContext:\n            runAsUser: 0"));
  item("B askDockerfileBestPractice", await l8.askDockerfileBestPractice("FROM node:18-alpine AS builder\n...\nFROM node:18-alpine"));
  item("C askCICompliance", await l8.askCICompliance("name: Deploy\nuses: actions/checkout@v4\nuses: aws-actions/configure-aws-credentials@v2"));

  head("LEVEL 09", "Cross-Repo Analysis at Scale — parallel fan-out");
  item("A scanRepoSecurity", await l9.scanRepoSecurity("payments-service", "FROM node:16-alpine", "require('lodash@4.17.20')", "{\"dependencies\":{\"lodash\":\"^4.17.20\"}}"));
  item("B scanArgoHealth", await l9.scanArgoHealth("payments-api", "syncPolicy:\n  automated:\n    prune: true\n    selfHeal: true"));
  item("C detectTerraformDrift", await l9.detectTerraformDrift("production-us-east", "Plan: 1 to add, 2 to change, 0 to destroy"));

  head("LEVEL 10", "Fully Agentic DevOps Jev — self-evaluation during operations");
  item("A diagnoseIncident", await l10.diagnoseIncident("Container started\nError: connection refused to database\nFATAL: password authentication failed", "Pod: api-gateway-xxx\nEvents: Back-off restarting"));
  item("B verifyPRSync", await l10.verifyPRSync("+service PaymentService { rpc Charge }", "paymentService:\n  enabled: true", "resource \"aws_lb\" \"payments\" {}"));
  item("C evaluateCanary", await l10.evaluateCanary("v2.1.0", 450, 0.15, 380, 0.02));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
