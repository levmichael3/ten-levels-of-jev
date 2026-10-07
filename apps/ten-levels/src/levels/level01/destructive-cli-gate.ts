/**
 * DevOps Level 1, option A: destructive CLI command gate.
 * One Noul in front of every kubectl / gcloud / aws command. Is this targeting ephemeral or production/stateful resources?
 */
import { jev } from "../../core/client.ts";
import { noul } from "../../core/helpers.ts";
import type { NoulAnswer } from "../../core/types.ts";

export type CLISafety = {
  destructive: boolean;
  targetsProduction: boolean;
  noul: number;
};

/** A: is this a destructive command targeting production? One Noul gates it. */
export async function destructiveCLIGate(command: string, context: string): Promise<CLISafety> {
  const { answers } = await jev.systemOne({ command, context }, {
    targets_production: noul("Does `command` target production, stateful, or customer-facing resources?", {
      true: "Targets prod namespaces, stateful sets, customer DBs, load balancers, or live services",
      false: "Targets dev, staging, ephemeral previews, local minikube, or sandbox clusters",
    }),
    is_destructive: noul("Does `command` delete, drop, scale down, or mutate resources in a way that is hard to undo?", {
      true: "kubectl delete, gcloud compute instances delete, terraform destroy, helm uninstall, pvc deletion",
      false: "kubectl get, describe, logs, port-forward, apply with no destructive changes",
    }),
  });

  const prod = answers.targets_production as NoulAnswer;
  const destructive = answers.is_destructive as NoulAnswer;
  const targetsProduction = prod.noul > 0.5;
  const isDestructive = destructive.noul > 0.5;

  return {
    destructive: isDestructive,
    targetsProduction,
    noul: Math.max(prod.noul, destructive.noul),
  };
}
