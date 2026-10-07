/**
 * DevOps Level 9, option A: fleet-wide security vulnerability scanner.
 * Fan out across repositories to analyze configurations and classify repos.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";

export type VulnStatus = "action_required" | "patched" | "not_applicable";

export type FleetSecurityResult = {
  repo: string;
  status: VulnStatus;
  confidence: number;
};

/** A: classify one repo's security posture. */
export async function scanRepoSecurity(repo: string, dockerfile: string, goMod: string, packageJson: string): Promise<FleetSecurityResult> {
  const { answers } = await jev.systemOne({ repo, dockerfile: dockerfile.slice(0, 500), goMod: goMod.slice(0, 500), packageJson: packageJson.slice(0, 500) }, {
    has_vuln: noul("Does this repository use outdated base images, known vulnerable dependencies, or missing security patches?"),
    status: choice("What is the security status of this repository?", {
      action_required: "Known vulnerabilities, outdated dependencies, or missing security patches",
      patched: "All known vulnerabilities addressed, dependencies up to date",
      not_applicable: "No dependencies, no container builds, or fully managed service with no user code",
    }),
  });

  const status = answers.status as ChoiceAnswer;

  return {
    repo,
    status: status.choice as VulnStatus,
    confidence: status.confidence,
  };
}
