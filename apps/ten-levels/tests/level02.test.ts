import test from "node:test";
import assert from "node:assert/strict";
import * as l2 from "../src/levels/level02/index.ts";

const bug = "Export button crashes settings page in Safari. Steps: click Export, app freezes. Works in Chrome.";
const billing = "You charged my card twice for order A-104. Please refund the duplicate charge.";

test("L2 A: a crashing bug routes to engineering", async () => {
  const t = await l2.triageTicket(bug);
  assert.equal(t.route, "engineering");
});

test("L2 A: a duplicate charge routes to billing", async () => {
  const t = await l2.triageTicket(billing);
  assert.equal(t.route, "billing");
});

test("L2 A: a feature request routes to product", async () => {
  const t = await l2.triageTicket("Feature request: please add a dark mode to the dashboard, it does not exist yet.");
  assert.equal(t.route, "product");
});

test("L2 A: both picks are always declared options (type safety)", async () => {
  const t = await l2.triageTicket("Random text with no strong signal for any team.");
  assert.ok(["engineering", "billing", "product", "human"].includes(t.route));
  assert.ok(["low", "normal", "high"].includes(t.priority));
});

test("L2 B: a senior resume is picked as senior and the match is a declared option", async () => {
  const v = await l2.screenResume(
    "10 years building distributed systems at Stripe. Led payments reconciliation. Mentored 6 engineers.",
    "Senior backend engineer. Requirements: distributed systems, payments, mentoring."
  );
  assert.equal(v.seniority, "senior");
  assert.ok(["different_field", "partial", "strong"].includes(v.match));
  assert.equal(v.proceed, v.seniority === "senior" && v.match === "strong");
});

test("L2 B: an intern resume does not proceed", async () => {
  const v = await l2.screenResume(
    "Recent graduate. Internship building a React dashboard. One hackathon win.",
    "Senior backend engineer. Requirements: distributed systems, payments, mentoring."
  );
  assert.equal(v.proceed, false);
});

test("L2 C: a dev-tool sponsor inquiry gets the auto-reply", async () => {
  const q = await l2.qualifySponsorForm({
    name: "Managed Postgres",
    description: "We make managed PostgreSQL hosting and want to pay for placement in the newsletter in October.",
    opportunity: "link",
  });
  assert.equal(q.intent, "sponsorship");
  assert.equal(q.category, "dev_tool");
  assert.equal(q.autoReply, true);
});

test("L2 C: a support request never gets the sponsor auto-reply", async () => {
  const q = await l2.qualifySponsorForm({
    name: "Jane",
    description: "I cannot log into the newsletter archive, the password reset email never arrives. Something is broken.",
    opportunity: "link",
  });
  assert.equal(q.intent, "support");
  assert.equal(q.autoReply, false);
});
