/**
 * Scenarios: the thirty options the lab can run, three per level.
 *
 * Each option declares
 *   file    the real source file the page shows as the code
 *   inputs  example states (Set A, B, C, up to E), editable in the page before Run live
 *   call    the call line the page renders with the live input ({{key}} placeholders)
 *   run     (input, { emit }) -> the decision, with the same input the page edited
 */
import * as l1 from "../src/levels/level01/index.ts";
import * as l2 from "../src/levels/level02/index.ts";
import * as l3 from "../src/levels/level03/index.ts";
import * as l4 from "../src/levels/level04/index.ts";
import * as l5 from "../src/levels/level05/index.ts";
import * as l6 from "../src/levels/level06/index.ts";
import * as l7 from "../src/levels/level07/index.ts";
import * as l8 from "../src/levels/level08/index.ts";
import * as l9 from "../src/levels/level09/index.ts";
import * as l10 from "../src/levels/level10/index.ts";

export const SCENARIOS = {
  1: { options: [
    { key: "A", name: "Destructive CLI gate", file: "level01/destructive-cli-gate.ts",
      inputs: [
        { command: "kubectl delete pvc data-postgres-0 -n production", context: "production cluster, customer DB" },
        { command: "kubectl get pods -n staging", context: "staging environment" },
        { command: "gcloud compute instances delete web-server-01 --zone=us-central1-a", context: "production load balancer instance" },
      ],
      call: "const decision = await destructiveCLIGate({{command}}, {{context}});",
      run: (i) => l1.destructiveCLIGate(i.command, i.context) },
    { key: "B", name: "PR fast-track gate", file: "level01/pr-fast-track-gate.ts",
      inputs: [
        { filesChanged: ["README.md", "docs/API.md"], commitMessage: "docs: update API documentation and examples" },
        { filesChanged: ["src/auth/token.ts", "src/db/migrations/004_add_session.sql"], commitMessage: "feat: add JWT refresh tokens and session migration" },
        { filesChanged: ["tests/unit/utils.test.ts"], commitMessage: "test: add coverage for date formatting utility" },
      ],
      call: "const decision = await prFastTrackGate({{filesChanged}}, {{commitMessage}});",
      run: (i) => l1.prFastTrackGate(i.filesChanged, i.commitMessage) },
    { key: "C", name: "Incident pager gate", file: "level01/incident-pager-gate.ts",
      inputs: [
        { alert: "CPU usage > 90% for 5 minutes on prod-api-03", source: "Prometheus" },
        { alert: "Payment webhook returning 500, 12% of transactions failing", source: "PagerDuty" },
        { alert: "Disk usage > 85% on staging-log-aggregator", source: "Datadog" },
      ],
      call: "const decision = await incidentPagerGate({{alert}}, {{source}});",
      run: (i) => l1.incidentPagerGate(i.alert, i.source) },
  ]},

  2: { options: [
    { key: "A", name: "Runner allocation", file: "level02/runner-allocation.ts",
      inputs: [
        { diffSummary: "+ Dockerfile: multi-stage build with node:18-alpine, 12 deps added", dockerfile: "FROM node:18-alpine AS builder..." },
        { diffSummary: "+ README.md, + docs/CHANGELOG.md", dockerfile: "" },
        { diffSummary: "+ src/ml/inference.py: PyTorch model loading, CUDA kernels", dockerfile: "FROM nvidia/cuda:11.8-runtime-ubuntu22.04..." },
      ],
      call: "const decision = await allocateRunner({{diffSummary}}, {{dockerfile}});",
      run: (i) => l2.allocateRunner(i.diffSummary, i.dockerfile) },
    { key: "B", name: "Change classifier", file: "level02/change-classifier.ts",
      inputs: [
        { commitMessage: "feat: add OAuth2 login with Google and GitHub providers", changedFiles: ["src/auth/oauth.ts", "src/db/migrations/005_oauth.sql", "tests/auth/oauth.test.ts"] },
        { commitMessage: "docs: update API reference with new endpoints", changedFiles: ["docs/API.md", "docs/examples.md"] },
        { commitMessage: "chore: bump lodash 4.17.20 -> 4.17.21", changedFiles: ["package.json", "package-lock.json"] },
      ],
      call: "const decision = await classifyChange({{commitMessage}}, {{changedFiles}});",
      run: (i) => l2.classifyChange(i.commitMessage, i.changedFiles) },
    { key: "C", name: "Alert triage", file: "level02/alert-triage.ts",
      inputs: [
        { podName: "api-gateway-7d9f4b8c5-x2v4m", event: "CrashLoopBackOff: container exiting with code 137 (OOMKilled)", namespace: "production" },
        { podName: "data-pipeline-worker-abc123", event: "Pod scheduled but failing to mount PVC", namespace: "data-platform" },
        { podName: "frontend-edge-cdn-xyz789", event: "High 5xx rate (15%) on static assets", namespace: "frontend" },
      ],
      call: "const decision = await triageAlert({{podName}}, {{event}}, {{namespace}});",
      run: (i) => l2.triageAlert(i.podName, i.event, i.namespace) },
  ]},

  3: { options: [
    { key: "A", name: "ArgoCD risk score", file: "level03/argocd-risk-score.ts",
      inputs: [
        { namespace: "production-payments", diffSummary: "+ 3 files: update payment gateway timeout from 30s to 60s, add retry logic", timeWindow: "Tuesday 14:00 UTC (peak hours)" },
        { namespace: "staging-api", diffSummary: "+ 1 file: update README in Helm chart", timeWindow: "Saturday 02:00 UTC (off-peak)" },
        { namespace: "production-core", diffSummary: "+ 15 files: replace PostgreSQL 13 with 15, migration scripts, connection pool changes", timeWindow: "Friday 18:00 UTC (launch window)" },
      ],
      call: "const decision = await argocdRiskScore({{namespace}}, {{diffSummary}}, {{timeWindow}});",
      run: (i) => l3.argocdRiskScore(i.namespace, i.diffSummary, i.timeWindow) },
    { key: "B", name: "Cluster upgrade score", file: "level03/cluster-upgrade-score.ts",
      inputs: [
        { nodePool: "prod-worker-pool", workloadSummary: "50 pods, 12 stateful (Redis, Postgres), PDBs allow 30% disruption" },
        { nodePool: "staging-pool", workloadSummary: "20 pods, all stateless, no PDBs defined" },
        { nodePool: "ml-training-pool", workloadSummary: "8 pods, 8 stateful (ML models), long-running jobs (4h+), no PDBs" },
      ],
      call: "const decision = await clusterUpgradeScore({{nodePool}}, {{workloadSummary}});",
      run: (i) => l3.clusterUpgradeScore(i.nodePool, i.workloadSummary) },
    { key: "C", name: "Dependency drift", file: "level03/dependency-drift.ts",
      inputs: [
        { component: "shared-helm-chart", changeSummary: "Patch: fix ingress annotation for AWS ALB", consumerCount: 45 },
        { component: "terraform-aws-module", changeSummary: "Major: replace RDS module with Aurora Serverless v2", consumerCount: 12 },
        { component: "logging-library", changeSummary: "Minor: add structured JSON logging support", consumerCount: 8 },
      ],
      call: "const decision = await dependencyDrift({{component}}, {{changeSummary}}, {{consumerCount}});",
      run: (i) => l3.dependencyDrift(i.component, i.changeSummary, i.consumerCount) },
  ]},

  4: { options: [
    { key: "A", name: "ArgoCD sync gate", file: "level04/argocd-sync-gate.ts",
      inputs: [
        { appName: "payments-api", diffSummary: "+ 2 files: increase timeout, add circuit breaker", targetEnv: "production" },
        { appName: "frontend-dashboard", diffSummary: "+ 1 file: CSS fix for mobile layout", targetEnv: "staging" },
        { appName: "auth-service", diffSummary: "+ 5 files: OAuth2 provider migration", targetEnv: "production" },
      ],
      call: "const decision = await gateArgoSync({{appName}}, {{diffSummary}}, {{targetEnv}});",
      run: (i) => l4.gateArgoSync(i.appName, i.diffSummary, i.targetEnv) },
    { key: "B", name: "Resource cleanup gate", file: "level04/resource-cleanup-gate.ts",
      inputs: [
        { resourceId: "preview-env-pr-1042", lastAccessed: "2024-01-15", resourceType: "ephemeral namespace" },
        { resourceId: "prod-db-snapshot-2023-11", lastAccessed: "2023-11-30", resourceType: "RDS snapshot" },
        { resourceId: "staging-s3-bucket-logs", lastAccessed: "2024-01-20", resourceType: "S3 bucket" },
      ],
      call: "const decision = await gateResourceCleanup({{resourceId}}, {{lastAccessed}}, {{resourceType}});",
      run: (i) => l4.gateResourceCleanup(i.resourceId, i.lastAccessed, i.resourceType) },
    { key: "C", name: "Rollback trigger", file: "level04/rollback-trigger.ts",
      inputs: [
        { serviceName: "payments-api", errorRate: 0.15, baselineRate: 0.002, latencyP95: 4500 },
        { serviceName: "frontend-dashboard", errorRate: 0.003, baselineRate: 0.001, latencyP95: 1200 },
        { serviceName: "auth-service", errorRate: 0.08, baselineRate: 0.001, latencyP95: 2800 },
      ],
      call: "const decision = await triggerRollback({{serviceName}}, {{errorRate}}, {{baselineRate}}, {{latencyP95}});",
      run: (i) => l4.triggerRollback(i.serviceName, i.errorRate, i.baselineRate, i.latencyP95) },
  ]},

  5: { options: [
    { key: "A", name: "Debug router", file: "level05/debug-router.ts",
      inputs: [
        { query: "Pod api-gateway-7d9f4b8c5-x2v4m is CrashLoopBackOff in production", context: "production namespace, customer-facing API" },
        { query: "Terraform plan fails with 'Invalid parameter: subnet ID'", context: "staging environment, VPC module" },
        { query: "Cross-service latency spikes after last deploy, which service is the bottleneck?", context: "5 microservices, distributed tracing enabled" },
      ],
      call: "const decision = await routeDebug({{query}}, {{context}});",
      run: (i) => l5.routeDebug(i.query, i.context) },
    { key: "B", name: "Terraform router", file: "level05/terraform-router.ts",
      inputs: [
        { diffSummary: "+ variables.tf: add new RDS instance class", filesChanged: ["variables.tf", "main.tf", "outputs.tf"] },
        { diffSummary: "+ README.md: update architecture diagram", filesChanged: ["README.md", "docs/arch.png"] },
        { diffSummary: "+ state.tf: migrate from S3 backend to Terraform Cloud", filesChanged: ["state.tf", ".terraform.lock.hcl"] },
      ],
      call: "const decision = await routeTerraform({{diffSummary}}, {{filesChanged}});",
      run: (i) => l5.routeTerraform(i.diffSummary, i.filesChanged) },
    { key: "C", name: "Log analysis router", file: "level05/log-router.ts",
      inputs: [
        { logSource: "api-gateway", sampleLines: "2024-01-20T10:15:30Z GET /health 200 2ms\n2024-01-20T10:15:31Z GET /api/v1/users 500 4500ms error: timeout", knownPatterns: true },
        { logSource: "payment-webhook", sampleLines: "Webhook received: invoice.paid\nProcessing: invoice_1042\nError: Connection refused to upstream", knownPatterns: false },
        { logSource: "kubernetes-cluster", sampleLines: "Pod api-gateway-7d9f4b8c5-x2v4m OOMKilled\nContainer exited with code 137\nRestarting (1/5)", knownPatterns: true },
      ],
      call: "const decision = await routeLogAnalysis({{logSource}}, {{sampleLines}}, {{knownPatterns}});",
      run: (i) => l5.routeLogAnalysis(i.logSource, i.sampleLines, i.knownPatterns) },
  ]},

  // Levels 6 to 10 run a real pi session in the sandbox. Each option loads an extension and a tool
  // allowlist; the input set holds the prompt, a suggested follow up, and the extension config.
  6: { agent: true, options: [
    { key: "A", name: "K8s gate", file: "level06/k8s-gate.ts", extension: "jev-guard.ts", tools: ["read", "bash", "edit", "write"],
      inputs: [
        { prompt: "Deploy the payment service to production: run kubectl apply -f payments-deployment.yaml -n production", then: "Check if the deployment succeeded: kubectl rollout status deployment/payments -n production", gates: ["A"] },
        { prompt: "Delete the old preview environment: kubectl delete namespace preview-pr-1042", then: "Verify it's gone: kubectl get namespaces | grep preview", gates: ["A"] },
        { prompt: "Get the logs from the failing pod: kubectl logs api-gateway-7d9f4b8c5-x2v4m -n production --tail=100", then: "Describe the pod for events: kubectl describe pod api-gateway-7d9f4b8c5-x2v4m -n production", gates: ["A"] },
      ],
      call: "pi.on(\"tool_call\", ...) -> gateK8SCommand(command, namespace, tags)  // { block, reason }" },
    { key: "B", name: "Write guard", file: "level06/file-write-guard.ts", extension: "jev-guard.ts", tools: ["read", "bash", "edit", "write"],
      inputs: [
        { prompt: "Update the shared CI workflow at .github/workflows/deploy.yml to add a new staging step", then: "Also update the root Terraform module at terraform/main.tf to add the new VPC", gates: ["B"] },
        { prompt: "Write a note to docs/DEPLOYMENT.md about the new canary process", then: "Create a new file src/auth/new-provider.ts with the OAuth2 implementation", gates: ["B"] },
        { prompt: "Add the database password to config/secrets.yml so the app can connect", then: "Instead, write a script that loads it from the environment", gates: ["B"] },
      ],
      call: "pi.on(\"tool_call\", ...) -> guardFileWrite(path, content, repoScope)  // { block, reason }" },
    { key: "C", name: "Secret screen", file: "level06/secret-screen.ts", extension: "jev-guard.ts", tools: ["read", "bash", "edit", "write"],
      inputs: [
        { prompt: "Run kubectl get secret db-credentials -n production -o yaml and show me the output", then: "Run terraform output database_url and show the result", gates: ["C"] },
        { prompt: "Read the environment file at /etc/app/env and summarize the config", then: "Show me the AWS credentials file at ~/.aws/credentials", gates: ["C"] },
        { prompt: "Run echo $STRIPE_API_KEY to verify it's set in the environment", then: "Run env | grep SECRET to check all secret variables", gates: ["C"] },
      ],
      call: "pi.on(\"tool_result\", ...) -> screenCommandOutput(output, command)  // { flag, banner }" },
  ]},

  // Level 7 runs a real pi session in the sandbox with the compaction extension loaded.
  7: { agent: true, options: [
    { key: "A", name: "Log truncator", file: "level07/log-truncator.ts", extension: "jev-compact.ts",
      tools: ["read", "bash", "edit", "write", "compact_now", "should_i_compact"],
      inputs: [
        { prompt: "The CI build failed. Read logs/ci-build.log (100 lines) and tell me what failed. Drop the routine setup and passing tests. Keep the failure and the lines around it.",
          then: "Now fix the failing test and run the build again.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
        { prompt: "Show me the last 1000 lines of the production api-gateway logs and summarize any errors.",
          then: "Filter for 5xx status codes and show me the unique endpoints.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
        { prompt: "Read the full Terraform plan output and highlight any destructive changes.",
          then: "Apply the plan if it looks safe.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
      ],
      call: "pi.on(\"turn_end\", ...) -> decideLogChunk(answers)  // drop, keep, or highlight" },
    { key: "B", name: "Manifest summarizer", file: "level07/manifest-summarizer.ts", extension: "jev-compact.ts",
      tools: ["read", "bash", "edit", "write", "compact_now", "should_i_compact"],
      inputs: [
        { prompt: "Get the full YAML output of the failing pod: kubectl get pod api-gateway-xxx -o yaml -n production",
          then: "Focus on the container status and events only.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
        { prompt: "Show me the full Helm values file for the payment service.",
          then: "Highlight any missing resource limits or security contexts.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
        { prompt: "Get all ConfigMaps in the production namespace and show me the database configuration.",
          then: "Check if the connection pool settings are correct.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
      ],
      call: "pi.on(\"turn_end\", ...) -> decideManifestSection(answers)  // drop, keep, or highlight" },
    { key: "C", name: "Diff pruner", file: "level07/diff-pruner.ts", extension: "jev-compact.ts",
      tools: ["read", "bash", "edit", "write", "compact_now", "should_i_compact"],
      inputs: [
        { prompt: "Show me the full git diff for the cross-service PR that updates the API contract.",
          then: "Focus on the proto files and API endpoint changes only.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
        { prompt: "Get the diff for the Terraform module changes across all environments.",
          then: "Highlight any security group or IAM policy changes.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
        { prompt: "Show me the dependency changes in go.mod and package.json for the monorepo update.",
          then: "Flag any major version bumps or removed packages.",
          lines: { notice: 6000, recommend: 10000, request: 14000 } },
      ],
      call: "pi.on(\"turn_end\", ...) -> decideDiffChunk(answers)  // drop, keep, or highlight" },
  ]},

  8: { agent: true, options: [
    { key: "A", name: "ask_jev_manifest_security", file: "level08/manifest-security.ts", extension: "ask-jev-file.ts", tools: ["read", "bash", "ask_jev_file_bool", "ask_jev_file_choice", "ask_jev_file_score"],
      inputs: [
        { prompt: "Without reading the files, use ask_jev_file_bool on k8s/payments-deployment.yaml and k8s/api-gateway-deployment.yaml. Does each run as root? Does each lack resource limits?", then: "Same checks for k8s/auth-deployment.yaml and k8s/database-statefulset.yaml." },
        { prompt: "Does k8s/redis-deployment.yaml mount any sensitive host paths? Use ask_jev_file_bool instead of reading the file.", then: "And does k8s/redis-deployment.yaml set hostNetwork?" },
        { prompt: "Check these production manifests for a missing securityContext. Use ask_jev_file_bool on each and do not read them: k8s/payments-deployment.yaml, k8s/api-gateway-deployment.yaml, k8s/auth-deployment.yaml, k8s/database-statefulset.yaml, k8s/redis-deployment.yaml.", then: "Which ones need attention?" },
      ],
      call: "ask_jev_file_bool(path, question, yes?, no?) -> { path, answer, noul }" },
    { key: "B", name: "ask_jev_dockerfile_best_practice", file: "level08/dockerfile-check.ts", extension: "ask-jev-file.ts", tools: ["read", "bash", "ask_jev_file_bool", "ask_jev_file_choice", "ask_jev_file_score"],
      inputs: [
        { prompt: "Use ask_jev_file_bool on docker/payments/Dockerfile, docker/api-gateway/Dockerfile, and docker/auth/Dockerfile. Does each pin its base image tag? Does each use a multi-stage build? Do not read the files.", then: "Same checks for docker/frontend/Dockerfile and docker/worker/Dockerfile." },
        { prompt: "Does docker/ml-inference/Dockerfile use a minimal base image? Use ask_jev_file_bool instead of reading it.", then: "And does docker/ml-inference/Dockerfile pin the CUDA base image tag?" },
        { prompt: "Check every Dockerfile under docker/ for an unpinned latest tag or a root user. Use ask_jev_file_bool on each file and do not read them.", then: "Which ones need updating?" },
      ],
      call: "ask_jev_file_choice(path, question, options) -> { path, choice, confidence, probabilities }" },
    { key: "C", name: "ask_jev_ci_compliance", file: "level08/ci-compliance.ts", extension: "ask-jev-file.ts", tools: ["read", "bash", "ask_jev_file_bool", "ask_jev_file_choice", "ask_jev_file_score"],
      inputs: [
        { prompt: "Use ask_jev_file_bool on .github/workflows/deploy.yml and .github/workflows/test.yml. Does each pin every third-party action to a version? Do not read the files.", then: "Same check for .github/workflows/security-scan.yml." },
        { prompt: "Does .github/workflows/deploy-production.yml require a manual approval before deploy? Use ask_jev_file_bool instead of reading it.", then: "And does .github/workflows/deploy-production.yml avoid hardcoding secrets?" },
        { prompt: "Check every file in .github/workflows for pinned actions, an approval gate, and no hardcoded secrets. Use ask_jev_file_bool on each and do not read them.", then: "Which workflows pass and which need fixes?" },
      ],
      call: "ask_jev_file_score(path, question, levels) -> { path, score, top, nearest, confidence, legend }" },
  ]},

  9: { agent: true, options: [
    { key: "A", name: "Fleet security scan", file: "level09/fleet-security.ts", extension: "ask-jev-files.ts", tools: ["read", "bash", "ask_jev_files", "pick_first_file"],
      inputs: [
        { prompt: "Scan all service repositories for security issues. Use ask_jev_files to check each Dockerfile and go.mod for outdated dependencies and vulnerabilities.", then: "Report which repos need immediate action." },
        { prompt: "Check all repos for pinned base images in Dockerfiles and up-to-date dependencies. Fan out with ask_jev_files.", then: "Which repos are compliant?" },
        { prompt: "Security audit: ask every repo whether it has known vulnerabilities in dependencies or uses outdated base images.", then: "Summarize the fleet security posture." },
      ],
      call: "ask_jev_files(paths_or_globs, questions_json, recursive?) -> { results: [{ path, answers }], skipped, calls }" },
    { key: "B", name: "ArgoCD health sweep", file: "level09/argo-health.ts", extension: "ask-jev-files.ts", tools: ["read", "bash", "ask_jev_files", "pick_first_file"],
      inputs: [
        { prompt: "Scan all ArgoCD application manifests for misconfigured sync policies and missing health checks. Use ask_jev_files.", then: "Which applications need attention?" },
        { prompt: "Check every ArgoCD app for automated sync with prune enabled or missing resource quotas. Fan out with ask_jev_files.", then: "Report the misconfigured apps." },
        { prompt: "Health sweep: ask every ArgoCD app whether it has health checks and safe sync policies.", then: "Summarize the fleet health." },
      ],
      call: "expandPatterns(patterns, cwd, recursive) -> pruneFiles(paths, cwd)  // skips, sizes, the 255 cap" },
    { key: "C", name: "Terraform drift detection", file: "level09/terraform-drift.ts", extension: "ask-jev-files.ts", tools: ["read", "bash", "ask_jev_files", "pick_first_file"],
      inputs: [
        { prompt: "Run terraform plan across all environments and use ask_jev_files to classify the drift severity for each.", then: "Which environments have high-risk drift?" },
        { prompt: "Check all environments for Terraform drift: resource destruction, security group changes, or data store modifications.", then: "Report the drift by severity." },
        { prompt: "Drift detection: ask every environment whether its Terraform state matches the config and classify the severity.", then: "Summarize which environments need remediation." },
      ],
      call: "pickFirstFile(question, candidates) -> { path | null, confidence, probabilities }" },
  ]},

  // Level 10: one general tool, ask_jev(state, questions_json).
  10: { agent: true, options: [
    { key: "A", name: "Incident remediation", file: "level10/incident-remediation.ts", extension: "ask-jev.ts", tools: ["read", "bash", "edit", "write", "ask_jev"],
      inputs: [
        { prompt: "The api-gateway pod is CrashLoopBackOff in production. Use ask_jev with the pod logs and events to diagnose the root cause and decide the next action.",
          then: "Apply the fix and verify the pod is healthy." },
        { prompt: "Payment webhooks are failing 15% of the time. Use ask_jev to classify the failure type from the logs and decide whether to rollback or fix forward.",
          then: "Implement the chosen fix and monitor." },
        { prompt: "Database connections are timing out after the last deploy. Use ask_jev with the connection pool metrics and error logs to diagnose.",
          then: "Apply the fix and verify connection health." },
      ],
      call: "ask_jev({ command, paths, state, questions_json }) -> { answers, state_summary }" },
    { key: "B", name: "PR synthesis", file: "level10/pr-synthesis.ts", extension: "ask-jev.ts", tools: ["read", "bash", "edit", "write", "ask_jev"],
      inputs: [
        { prompt: "I changed the API spec in the service repo, updated the Helm chart, and modified the Terraform module. Use ask_jev to verify all three are synchronized.",
          then: "Fix any mismatches and confirm alignment." },
        { prompt: "The auth service PR changes OAuth2 scopes. Use ask_jev to check if the API gateway and frontend repos are updated to match.",
          then: "Update any downstream repos that are out of sync." },
        { prompt: "A database schema change requires updates to the API, ORM, and cache layer. Use ask_jev to verify cross-repo consistency.",
          then: "Apply missing changes and run integration tests." },
      ],
      call: "ASK_JEV_DESCRIPTION  // the description carries the schema the agent writes against" },
    { key: "C", name: "Canary evaluator", file: "level10/canary-evaluator.ts", extension: "ask-jev.ts", tools: ["read", "bash", "edit", "write", "ask_jev"],
      inputs: [
        { prompt: "The payments service canary is at 10% traffic. Use ask_jev with Prometheus metrics to evaluate if latency and error rates are within SLO.",
          then: "Promote to 50% traffic or rollback based on the evaluation." },
        { prompt: "New API gateway version is canaried at 5%. Use ask_jev to judge whether P95 latency and 5xx rates are acceptable compared to baseline.",
          then: "Decide: promote, hold, or rollback." },
        { prompt: "The auth service v2.1.0 is in canary. Use ask_jev with metric snapshots to evaluate if it meets SLOs.",
          then: "Promote to full traffic or rollback." },
      ],
      call: "assembleState({ state, paths, command }, cwd, run) -> { state, summary }  // refused with a split when over budget" },
  ]},

};
