/**
 * Level 2, option B: resume screening.
 * Not "rate this resume". Two Choice questions in one call: how senior, and how well the resume matches the job. Code decides who proceeds.
 */
import { jev } from "../../core/client.ts";
import { choice } from "../../core/helpers.ts";
import type { ChoiceAnswer } from "../../core/types.ts";

export type Seniority = "junior" | "mid" | "senior";
export type Match = "different_field" | "partial" | "strong";

export type ResumeVerdict = {
  proceed: boolean;
  seniority: Seniority;
  match: Match;
};

/** B: two picks, one call. Proceed only when both picks are the ones the role needs. */
export async function screenResume(resume: string, jobDescription: string): Promise<ResumeVerdict> {
  const { answers } = await jev.systemOne({ resume, job_description: jobDescription }, {
    seniority: choice("How senior is the candidate in `resume`?", {
      junior: "Guided work, internships, limited ownership",
      mid: "Owns features end to end",
      senior: "Owns systems, sets direction, mentors others",
    }),
    match: choice("How well does `resume` match `job_description`?", {
      different_field: "Experience is in another discipline entirely",
      partial: "Some of the requirements are met",
      strong: "The requirements are met with directly relevant experience",
    }),
  });

  const seniority = (answers.seniority as ChoiceAnswer).choice as Seniority;
  const match = (answers.match as ChoiceAnswer).choice as Match;
  return { proceed: seniority === "senior" && match === "strong", seniority, match };
}
