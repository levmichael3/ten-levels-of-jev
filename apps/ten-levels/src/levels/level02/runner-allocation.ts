/**
 * DevOps Level 2, option A: CI/CD runner allocation.
 * Classify pipeline workloads by resource demands based on the diff/dockerfile.
 */
import { jev } from "../../core/client.ts";
import { choice } from "../../core/helpers.ts";
import type { ChoiceAnswer } from "../../core/types.ts";

export type RunnerProfile = "lightweight_lint" | "build_cpu_heavy" | "e2e_gpu_required" | "ephemeral_k8s_cluster";

export type RunnerAllocation = {
  profile: RunnerProfile;
  confidence: number;
};

/** A: which runner profile should handle this pipeline? */
export async function allocateRunner(diffSummary: string, dockerfile?: string): Promise<RunnerAllocation> {
  const { answers } = await jev.systemOne({ diff: diffSummary, dockerfile: dockerfile || "none" }, {
    workload: choice("What kind of workload does this pipeline need?", {
      lightweight_lint: "Static analysis, formatting, type checks, or unit tests only",
      build_cpu_heavy: "Multi-arch builds, heavy compilation, asset bundling, or large dependency trees",
      e2e_gpu_required: "End-to-end tests, visual regression, ML model validation, or GPU workloads",
      ephemeral_k8s_cluster: "Integration tests needing real K8s, helm validation, or multi-service setup",
    }),
  });

  const w = answers.workload as ChoiceAnswer;
  return {
    profile: w.choice as RunnerProfile,
    confidence: w.confidence,
  };
}
