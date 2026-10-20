---
description: Prime on the 10 Levels of Jev codebase — the lab, the terminal runner, and the skill you hand agents to build with Jev
---

# Purpose

Orient yourself in this repository: thirty tested Jev use cases arranged in ten levels. Levels 1-5 call Jev from plain code and run in one call in the Vue lab. Levels 6-10 put Jev inside the pi coding agent harness, hooks first then tools, and run as real pi sessions in a sandbox repo in the agent chat window. Plus a per-level terminal runner and a portable skill that teaches an agent to build with Jev.

## Workflow

1. Run `git ls-files` to see the tracked tree. The app is `apps/ten-levels/`, `.claude/skills/hyper-jev/` is the skill (cookbook plus starter template) you hand an agent to build with Jev, `.opencode/skills/direct-jev/` is the lightweight direct-API skill with one recipe per lab level, `images/` holds the video's diagrams the README uses.
2. Read `README.md` and the `justfile` recipes: `just web` builds and serves the lab on 4399, `just dev` is Vite hot reload on 5173 (needs `just web` running for the API, shift reload only resets the landing page on 4399), `just jev1` through `just jev10` run one level in the terminal (add `a`, `b`, or `c` for one option), `just test`, `just test-live`, `just heroes`, `just lint`.
3. Read `apps/ten-levels/README.md` for the ladder, the ten rules the code follows, mock versus live, and the paragraph on levels 6-10.
4. Read the core contract: `apps/ten-levels/src/core/types.ts` (wire types, validation, limits), `client.ts` (TypeSafe + mock), `helpers.ts`, `mock.ts`.
5. Read one code level end to end, e.g. `apps/ten-levels/src/levels/level02/`: `index.ts`, then the three option files. Levels 1-5 are plain async functions; levels 6-10 hold the decision code the extensions import.
6. Read one agentic level, e.g. `apps/ten-levels/src/levels/level07/` plus `apps/ten-levels/extensions/jev-compact.ts` (the pi extension that calls it from the turn-end hook). Then skim `extensions/report.ts`, the side channel every extension reports on, and the other four extensions: `jev-guard.ts` (L6 tool-call + tool-result hooks), `ask-jev-file.ts` (L8, three flat tools), `ask-jev-files.ts` (L9, one call per file in parallel), `ask-jev.ts` (L10, one tool over state, paths, and a command).
7. Read `apps/ten-levels/server/scenarios.mjs` (the thirty options: file, input sets, call template, run for 1-5, extension + tool allowlist for 6-10), `server/server.mjs` (the API: `/api/level/:n`, `/api/run/:n` as SSE, `/api/agent/*` for pi sessions, static serving of `web/dist`), `server/agent-session.mjs` (one pi RPC process per session in its own git-initialized copy of `sandbox/`, agent inference via LiteLLM, Jev decisions via TypeSafe).
8. Skim `apps/ten-levels/sandbox/`: the small billing service the agents work in, with one failing test on purpose in `src/domain/billing.ts`, `.pi/settings.json` keeps recent tokens low so compaction happens in a short session.
9. Skim the Vue app in `apps/ten-levels/web/src/`: `views/LevelView.vue`, `components/LiveExample.vue` (use-case cards, input sets, sent/received, answers with polarity-aware confidence colors, cost table), `components/AgentChat.vue` (the agent window for 6-10: rows, detail modal, Go and Stop, model, LLM + Jev cost, context in tokens, files-not-read table), `components/RunVisual.vue` (the animated run modal, levels 1-5 only), `lib/hero-scenes.mjs` (hero drawings, also used by `scripts/build-heroes.mjs`), `lib/cost.ts`, `lib/highlight.ts`.
10. Know the runners: `apps/ten-levels/src/level.ts` (behind `just jev1` .. `just jev10`), `apps/ten-levels/src/demo.ts` (every level, every option), `apps/ten-levels/tests/` (201 offline on the mock, 10 live).
11. Know the keys: `TYPESAFE_API_KEY` for Jev decisions (levels 1-5 run on the mock without it; levels 6-10 need it), `LITELLM_API_KEY` for agent inference on levels 6-10 (model `litellm/free-smart`). Never print keys.
