/**
 * DevOps Level 5, option A: debug assistant router.
 * Route developer help requests to the cheapest tool/agent that can handle it.
 */
import { jev } from "../../core/client.ts";
import { choice, noul, score } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer, ScoreAnswer } from "../../core/types.ts";

export type DebugRoute =
  | "kubectl_lookup"
  | "terraform_syntax_fix"
  | "multi_repo_architecture"
  | "human_sre";

export type DebugRouter = {
  route: DebugRoute;
  effort: number;
  needsHuman: boolean;
  confidence: number;
};

/** A: route debug requests to the right tool. */
export async function routeDebug(query: string, context: string): Promise<DebugRouter> {
  const { answers } = await jev.systemOne({ query, context }, {
    route: choice("Which tool should handle this debug request?", {
      kubectl_lookup: "Fast deterministic kubectl logs / describe / get",
      terraform_syntax_fix: "Fast LLM for Terraform syntax or config validation",
      multi_repo_architecture: "Deep agent with full repo indexing for cross-service failure",
      human_sre: "Needs human judgment or production access not available to automation",
    }),
    ambiguity: score("How ambiguous is this request?", [
      "Clear error message with known fix",
      "Some investigation needed but scope is clear",
      "Open-ended, could involve multiple services or unknown root cause",
    ]),
    needs_prod: noul("Does this require production cluster access or privileged credentials?"),
  });

  const route = answers.route as ChoiceAnswer;
  const ambiguity = answers.ambiguity as ScoreAnswer;
  const needsProd = answers.needs_prod as NoulAnswer;

  const chosen = (route.confidence < 0.5 || needsProd.noul > 0.7) ? "human_sre" : route.choice as DebugRoute;

  return {
    route: chosen,
    effort: ambiguity.score,
    needsHuman: chosen === "human_sre",
    confidence: route.confidence,
  };
}
