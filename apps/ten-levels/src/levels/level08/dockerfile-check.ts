/**
 * DevOps Level 8, option B: ask_jev_dockerfile_best_practice.
 * Fast boolean check: "Does this Dockerfile use pinned base image tags and multi-stage builds?"
 */
import { jev } from "../../core/client.ts";
import { noul } from "../../core/helpers.ts";
import type { NoulAnswer } from "../../core/types.ts";

export type DockerfileCheck = {
  pinnedTags: boolean;
  multiStage: boolean;
  minimalImage: boolean;
  confidence: number;
};

/** B: best practice judgment on a Dockerfile without reading the full file. */
export async function askDockerfileBestPractice(dockerfileSnippet: string): Promise<DockerfileCheck> {
  const { answers } = await jev.systemOne({ dockerfile: dockerfileSnippet }, {
    pinned_tags: noul("Does this Dockerfile use pinned base image tags (specific digest or version like node:18.12.1, not 'latest')?"),
    multi_stage: noul("Does this Dockerfile use multi-stage builds to separate build and runtime dependencies?"),
    minimal_image: noul("Does this Dockerfile use a minimal base image (distroless, alpine, or slim) for the final stage?"),
  });

  const pinned = answers.pinned_tags as NoulAnswer;
  const multi = answers.multi_stage as NoulAnswer;
  const minimal = answers.minimal_image as NoulAnswer;

  return {
    pinnedTags: pinned.noul > 0.5,
    multiStage: multi.noul > 0.5,
    minimalImage: minimal.noul > 0.5,
    confidence: Math.max(pinned.noul, multi.noul, minimal.noul),
  };
}
