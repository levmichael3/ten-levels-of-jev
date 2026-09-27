/**
 * Level 2, option C: sponsor-form qualification.
 * Two Choice questions about one form submission, one call: what the sender wants, and what they sell. Code decides auto-reply or manual review.
 */
import { jev } from "../../core/client.ts";
import { choice } from "../../core/helpers.ts";
import type { ChoiceAnswer } from "../../core/types.ts";

export type Intent = "sponsorship" | "support" | "partnership" | "other";
export type ProductCategory = "dev_tool" | "course" | "unrelated";

export type SponsorQualification = {
  autoReply: boolean;
  intent: Intent;
  category: ProductCategory;
};

/** C: the sponsor-form example from the field. Auto-reply only to sponsors selling developer tools. */
export async function qualifySponsorForm(form: {
  name: string;
  description: string;
  opportunity: string;
}): Promise<SponsorQualification> {
  const { answers } = await jev.systemOne(form, {
    intent: choice("What does the sender of `description` want?", {
      sponsorship: "To pay for placement in the site or newsletter",
      support: "Help with an account, a login, or something broken",
      partnership: "A collaboration, cross-promotion, or content swap with no payment mentioned",
      other: "None of the above",
    }),
    category: choice("What kind of product is described by `name` and `description`?", {
      dev_tool: "Developer tools, hosting, APIs, SaaS for developers",
      course: "Courses, books, or training",
      unrelated: "Anything not aimed at developers",
    }),
  });

  const intent = (answers.intent as ChoiceAnswer).choice as Intent;
  const category = (answers.category as ChoiceAnswer).choice as ProductCategory;
  return { autoReply: intent === "sponsorship" && category === "dev_tool", intent, category };
}
