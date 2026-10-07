/**
 * DevOps Level 8, option A: ask_jev_manifest_security.
 * Ask Jev: "Does this K8s deployment run as root or lack resource limits?" without loading the full chart.
 */
import { jev } from "../../core/client.ts";
import { noul } from "../../core/helpers.ts";
import type { NoulAnswer } from "../../core/types.ts";

export type ManifestSecurity = {
  runsAsRoot: boolean;
  lacksResourceLimits: boolean;
  exposedSensitiveData: boolean;
  confidence: number;
};

/** A: security judgment on a K8s manifest without reading the full file. */
export async function askManifestSecurity(manifestSnippet: string): Promise<ManifestSecurity> {
  const { answers } = await jev.systemOne({ manifest: manifestSnippet }, {
    runs_as_root: noul("Does this manifest specify running containers as root user (runAsUser: 0 or no securityContext)?"),
    lacks_limits: noul("Does this manifest omit CPU or memory resource limits for any container?"),
    exposed_data: noul("Does this manifest mount sensitive host paths, use hostNetwork, or expose internal ports?"),
  });

  const root = answers.runs_as_root as NoulAnswer;
  const limits = answers.lacks_limits as NoulAnswer;
  const exposed = answers.exposed_data as NoulAnswer;

  return {
    runsAsRoot: root.noul > 0.5,
    lacksResourceLimits: limits.noul > 0.5,
    exposedSensitiveData: exposed.noul > 0.5,
    confidence: Math.max(root.noul, limits.noul, exposed.noul),
  };
}
