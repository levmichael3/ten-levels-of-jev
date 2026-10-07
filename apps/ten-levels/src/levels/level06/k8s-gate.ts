/**
 * DevOps Level 6, option A: agent kubectl / helm gate hook.
 * Intercept agent tool calls before execution. Block kubectl apply to prod unless bypass tags passed.
 */
import { jev } from "../../core/client.ts";
import { choice, noul } from "../../core/helpers.ts";
import type { ChoiceAnswer, NoulAnswer } from "../../core/types.ts";
import type { Decide } from "./bash-gate.ts";

export const K8S_QUESTIONS = {
  effect: choice("What does running `command` in `namespace` do to the cluster?", {
    read_only: "Lists, describes, logs, or port-forwards; nothing durable changes",
    reversible: "Applies or patches resources that can be rolled back with kubectl rollout undo",
    irreversible: "Deletes, prunes, or overwrites critical resources with no easy rollback",
  }),
  targets_prod: noul("Does `command` target a production namespace or customer-facing service?"),
  bypass_tag: noul("Does the request include an explicit production bypass tag or emergency override?"),
};

export interface K8SGateAnswers {
  effect: ChoiceAnswer;
  targets_prod: NoulAnswer;
  bypass_tag: NoulAnswer;
}

export interface K8SGateDecision {
  block: boolean;
  reason: string;
}

export const K8S_BLOCK_NOTICE =
  "This block is final. Do not try to work around it with another command, a different namespace, or an equivalent helm operation. Stop and tell the user what was blocked and why.";

/** Block or allow kubectl/helm commands. */
export function gateK8S(a: K8SGateAnswers): K8SGateDecision {
  if (a.targets_prod.noul > 0.7 && a.bypass_tag.noul < 0.5) {
    if (a.effect.choice === "irreversible") {
      return { block: true, reason: `Blocked irreversible command in production without bypass tag` };
    }
    if (a.effect.choice === "reversible" && a.effect.confidence > 0.7) {
      return { block: true, reason: `Blocked reversible command in production without explicit approval` };
    }
  }
  return { block: false, reason: `Allowed: ${a.effect.choice} in ${a.targets_prod.noul > 0.7 ? "production" : "non-production"}` };
}

export function k8sNamespace(command: string): string {
  return command.match(/(?:-n|--namespace)(?:=|\s+)(\S+)/)?.[1] ?? "";
}

export function isClusterCommand(command: string): boolean {
  return /^\s*(kubectl|helm)\b/.test(command);
}

/** A: full async gate with Jev call. `decide` defaults to the shared client; the extension passes a reporting one. */
export async function gateK8SCommand(command: string, namespace: string, tags: string[], decide: Decide = (s, q) => jev.systemOne(s, q)): Promise<K8SGateDecision> {
  const { answers } = await decide({ command, namespace, tags: tags.join(",") }, K8S_QUESTIONS);
  return gateK8S({
    effect: answers.effect as ChoiceAnswer,
    targets_prod: answers.targets_prod as NoulAnswer,
    bypass_tag: answers.bypass_tag as NoulAnswer,
  });
}
