/** Static level metadata the pages render before any API call. */
export interface LevelMeta {
  n: number;
  title: string;
  /** One description, always opening with "Use This For:" and when to reach for this level. */
  sub: string;
}

export const USE_LABEL = "Use This For:";

/** The description split at the label so the page can color it: [before, after]. */
export function splitUse(sub: string): [string, string] {
  const i = sub.indexOf(USE_LABEL);
  return i < 0 ? [sub, ""] : [sub.slice(0, i), sub.slice(i + USE_LABEL.length)];
}

export const LEVELS: LevelMeta[] = [
  { n: 1, title: "Single Decisions", sub: "Use This For: a yes or no, or one pick from a short list, that a regex or keyword check keeps getting wrong because meaning matters. The smart, cheap, fast if statement." },
  { n: 2, title: "Multiple Choice", sub: "Use This For: picking one option from a list you define, one or more questions per call." },
  { n: 3, title: "Composite Scoring", sub: "Use This For: grading on a scale you define. One Score per factor, and the weights that combine them live in code, so tuning means changing a number, not a prompt." },
  { n: 4, title: "Confidence Gating", sub: "Use This For: actions where a wrong answer costs more than asking a human. The answer says what, confidence says whether: confident runs, unsure confirms, low goes to a person." },
  { n: 5, title: "Intent and Model Routing", sub: "Use This For: one cheap decision in front of expensive things, where most requests do not need the big model, the browser, or a person." },
  { n: 6, title: "Guardrail Hooks", sub: "Use This For: checking every tool call before it runs, where the agent never sees the check. Bash, writes, and tool results, one hook each." },
  { n: 7, title: "Should I Compact", sub: "Use This For: telling an agent when its context has moved on. Numbers in code, judgment in Jev. The agent hears nothing, a notice, a recommendation, or a request." },
  { n: 8, title: "Cheap Reads", sub: "Use This For: a judgment about a file without reading it into context. Three tools, one question each, and the file never comes back." },
  { n: 9, title: "Files at Scale", sub: "Use This For: asking the same questions of many files in parallel, without reading any of them, and letting code cut the list." },
  { n: 10, title: "Agentic Jev", sub: "Use This For: letting your agent decide on its own when to use Jev. One ask_jev tool, a nudge in the system prompt, and the agent reaches for a typed decision whenever one beats reasoning." },
];

/** One sentence per use case, shown on the selectable cards. */
export const USE_CASES: Record<number, [string, string][]> = {
  1: [
    ["Prompt injection gate", "One Noul in front of everything else: is this text talking to us, or trying to instruct the model?"],
    ["Urgency gate", "One Noul: is this urgent? Above 0.7 the page triggers. The threshold is yours to read and move."],
    ["Ticket classifier", "One Choice: which department? The answer is always one of four. An other option gives the model an exit."],
  ],
  2: [
    ["Support triage", "Two Choices in one call: which team, how urgent. Both answers are options you declared."],
    ["Resume screening", "Not rate this resume. Two Choices: how senior, how well it matches. Code decides who proceeds."],
    ["Sponsor qualification", "Two Choices: what the sender wants, what they sell. Sponsorship plus dev tool gets the auto-reply."],
  ],
  3: [
    ["Ticket priority", "Severity 0.6, frustration 0.3, report quality 0.1. Weights a reviewer can read in one line."],
    ["Code-review risk", "Security risk, complexity, convention drift, commit quality, weighted into one number with a review threshold."],
    ["Idea verdict", "Problem, demand, monetization, differentiation. Four scores, one weighted number: kill, fix, or ship."],
  ],
  4: [
    ["Bash Tool Gate", "read only, reversible, irreversible before an agent runs anything. Low confidence is what asks the human."],
    ["Account actions", "check_balance runs above the floor. approve_transfer needs the 0.9 bar to run without a confirmation."],
    ["Citation check", "Does the source support the claim, is the quote faithful? Low confidence flags for review instead of failing silently."],
  ],
  5: [
    ["Agent router", "Which harness handles the task: script, fast agent, reasoning agent, browser agent, or human."],
    ["Intent router", "Order status never touches an LLM. Product questions get the LLM. Hard complaints go to a human."],
    ["Model router", "Choose the least costly model that can complete the task, plus an effort score for reasoning depth."],
  ],
  6: [
    ["Bash gate", "Before any command runs: read only, reversible, or irreversible, and does it mean to destroy. Irreversible blocks. The agent sees only the reason."],
    ["Write gate", "Paths outside the repo block in code, no call. Inside, Jev asks whether the file or its content holds a credential."],
    ["Result screen", "After a read or a command, before the model sees it: data, or instructions aimed at the agent? Flagged output gets a banner."],
  ],
  7: [
    ["Turn end hook", "Four questions after every turn, one call. Silent, notice, recommend, or request, with Jev's reason. The agent never asked."],
    ["On demand tool", "The agent calls should_i_compact and gets a typed verdict: should it, which tier, why, and what to do next."],
    ["Pick the cut point", "Before compaction, Jev picks which turn starts the live work. The pick becomes the summary instructions."],
  ],
  8: [
    ["ask_jev_file_bool", "One file, one yes or no. The agent asks whether a file validates tokens and gets a probability back, never the file."],
    ["ask_jev_file_choice", "One file, one pick from options the agent names. Which layer is this file? An exit option is added if the agent leaves none."],
    ["ask_jev_file_score", "One file, one scale the agent writes. How risky is a refactor? The nearest level comes back in words."],
  ],
  9: [
    ["Several paths, one block", "Raw Jev question JSON, several questions, one call per file, all in parallel. Answers per path."],
    ["A glob over a directory", "Code expands the glob, drops node_modules and binaries, refuses files over the budget, and caps at 255 before any call."],
    ["Recursive, then pick first", "Every file in the repo answers, then a second pass picks the one to open first. Keys are paths, so the pick is real."],
  ],
  10: [
    ["Triage a failure", "The tests are red. The agent runs them through ask_jev, code captures the output, and the failure comes back classified."],
    ["Judge a diff before shipping", "The agent wrote a change, then puts git diff through ask_jev for a risk score and a review call. It never pastes the diff."],
    ["Classify a request, gate a plan", "The customer's words as state, the code as paths, one call. Over budget, the error says how to split. The ledger says what it cost."],
  ],
};
