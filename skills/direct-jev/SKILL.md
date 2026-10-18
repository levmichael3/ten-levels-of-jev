---
name: direct-jev
description: System One decision skill via direct API call. One skill with ten short recipes for the ten Jev levels. Each recipe is a standalone Noul/Choice/Score question template with recommended thresholds. The agent assembles `state` fresh per call and applies the threshold. No JevClient SDK; native POST to TypeSafe System One API.
argument-hint: level question
---

# Direct Jev

## Purpose

One skill, ten recipes. The agent sends the current `state` (message, command, diff, file slice) to the TypeSafe System One API and receives a typed answer (noul / choice / score). The skill guides which recipe to use — the agent fills `state` per call and applies the recommended threshold. No JevClient SDK; no OpenRouter, no LiteLLM proxy for the Jev path. Levels 1–5 use the offline mock when `TYPESAFE_API_KEY` is absent; levels 6–10 need pi and a LiteLLM key.

## Ingredients

- **One POST**: `https://api.typesafe.ai/v1/systemone`
- **Authorization**: `Bearer TYPESAFE_API_KEY` (never printed, env‑only)
- **Body**: `{ model: "jev-latest", state, questions }`
- **No SDK**: The agent builds the JSON body itself. The skill only describes the shape.
- **Or use MCP**: project `opencode.json` wires local `jevbridge` (`jev_decide`, `jev_gate`,
  `jev_computer_use`, `jev_recipe`). Same questions, typed answers plus a confidence gate.
  See `JEVBRIDGE.md` for wire-up. Key via `{env:TYPESAFE_API_KEY}`.
- **Recipes live once**: in `skills/direct-jev/recipes/`. One file per lab level. The skill’s index points at them.

## Level Index

| Levels | When | What the agent does with the answer |
|---|---|---|
| 1–3 | One judgment, several labels, or a weighted score | Branch, route, or combine the numbers itself. Weights stay out of the request. |
| 4–5 | Cost of being wrong is high, or a cheaper path exists | Confidence or route decides whether to act, ask a person, or call the chat model. |
| 6–7 | A tool call or a long turn | Judge the command or the turn before acting. Compaction still belongs to the host. |
| 8–10 | Files, many files, or an open question | Send paths or command output to Jev from the shell. Bring back answers only, not the file text. |

Each recipe is one page: the level’s one idea, the JSON question (not a TypeScript helper), and the three lab options as examples. Follow the lab ladder in the root README. The `hyper-jev` cookbook renumbers levels 6–10 into different use cases, so those guides are the wrong source.

## What the Skill Cannot Pretend to Be

- **Levels 6–10 in the lab** are pi hooks and tools. A skill cannot intercept a tool call the way `jev-guard.ts` does. The recipe tells the agent to ask first and then obey the answer. The extension remains the hard gate inside the lab.
- **Levels 8–10 only stay "cheap reads"** if the file body never enters the chat. The recipe’s curl reads the path in the shell, posts that state, and prints the answer JSON. The agent does not `cat` the file first.

## Host Copies (thin, globally ignored)

Each host gets a short `SKILL.md` with the same front matter and the same level table, pointing at the canonical recipe paths:

- `.pi/skills/direct-jev/SKILL.md`
- `.opencode/skills/direct-jev/SKILL.md`
- `.claude/skills/direct-jev/SKILL.md`
- `.cursor/skills/direct-jev/SKILL.md`

Those four files are the copies. The ten recipes are not. New files in those host directories are globally ignored, so the commit un-ignores only those skill paths, or `git add -f` just those four files. `.pi/auth.json` stays ignored.

## Recipes (canonical, single source of truth)

Recipes live in `skills/direct-jev/recipes/`. One brief file per lab level (noul question, choice options, or score rubric, plus recommended thresholds). The agent reads only the recipe that fits the current level. Recipes are not tracked in git; they are referenced by the skill’s index. Each recipe includes:

- The level number and title
- The question block (one Noul, one Choice with ≤3 options, or one Score)
- Recommended threshold(s) (e.g. noul > 0.5 for yes/no decisions, confidence floor/bar)
- The three option descriptions as examples only

## Quick Start

```bash
# Ensure TYPESAFE_API_KEY is set (justfile loads .env per recipe)
export TYPESAFE_API_KEY=...

# Level 1: single noul judgment (prompt injection gate)
just jev1

# Level 4: confidence gating (bash tool gate)
just jev4

# Level 10: agentic Jev (ask_jev on any content)
just jev10
```

## Report Format

Report the implemented decision and file paths, selected provider behavior, tests actually run, and remaining production checks. Distinguish offline contract tests from live validation. Do not describe a mock run as a successful live deployment.
