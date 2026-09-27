/**
 * Level 2, option A: support triage.
 * Two Choice questions about one ticket, one call: which team, and how urgent. Every answer is one of the options you declared.
 */
import { jev } from "../../core/client.ts";
import { choice } from "../../core/helpers.ts";
import type { ChoiceAnswer } from "../../core/types.ts";

export type Route = "engineering" | "billing" | "product" | "human";
export type Priority = "low" | "normal" | "high";

export type TicketTriage = {
  route: Route;
  priority: Priority;
};

/** Which team each category goes to. The choice maps straight onto a code path. */
const ROUTES: Record<string, Route> = {
  bug_report: "engineering",
  billing: "billing",
  feature_request: "product",
  other: "human",
};

/** A: two picks from one ticket in one call. */
export async function triageTicket(ticket: string): Promise<TicketTriage> {
  const { answers } = await jev.systemOne({ ticket }, {
    category: choice("What kind of ticket is `ticket`?", {
      bug_report: "Something is broken, crashes, freezes, or behaves wrong",
      billing: "Charges, invoices, refunds, subscriptions",
      feature_request: "Asks for something that does not exist yet",
      other: "None of the above",
    }),
    priority: choice("How urgent is `ticket`?", {
      low: "A suggestion, a cosmetic issue, or a question with no deadline",
      normal: "A real problem, but the author can keep working",
      high: "The author is blocked, losing money or customers, or very angry",
    }),
  });

  const category = answers.category as ChoiceAnswer;
  const priority = answers.priority as ChoiceAnswer;
  return { route: ROUTES[category.choice], priority: priority.choice as Priority };
}
