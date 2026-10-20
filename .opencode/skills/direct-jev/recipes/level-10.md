level: 10
title: Agentic Jev
type: noul
question: Should the agent use Jev to validate its own assumption during this operation?
true: Agent calls ask_jev, receives typed answer (noul/choice/score), never sees files or output
false: Agent proceeds without Jev
threshold: ask_jev on triage/failure/diff/classification; ledger line records calls, questions, cost ($0.000084 typical)
options: A. Triage a failure, B. Judge a diff before shipping, C. Classify a request, gate a plan
