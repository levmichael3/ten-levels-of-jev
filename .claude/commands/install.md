---
description: Install 10 Levels of Jev — prerequisites, the web dependencies, the LiteLLM key, pi for the agentic levels, and a first offline test run
---

# Install 10 Levels of Jev

## Purpose

Set up the 10 Levels of Jev lab for development. Checks the toolchain (Node 24, bun, just, pi), installs the Vue lab's dependencies, confirms the Jev credential without displaying it, verifies the sandbox and the pi settings the agentic levels depend on, and runs the offline suite. This is an interactive, agentic process — ask the user when choices are needed.

## Variables

SOURCE_REPO: The directory this command is running from
APP_DIR: `apps/ten-levels`
WEB_DIR: `apps/ten-levels/web`
SANDBOX_DIR: `apps/ten-levels/sandbox`
EXTENSIONS_DIR: `apps/ten-levels/extensions`
ENV_FILE: `.env` at the repo root (loaded by the justfile)
ENV_SAMPLE: `.env.sample`

## Codebase Structure

```
apps/ten-levels/
├── src/core/          # the Jev wire contract and client (mock or LiteLLM)
├── src/levels/        # level01 .. level10, one file per option
├── extensions/        # pi extensions for levels 6 to 10, plus report.ts
├── sandbox/           # the repo the agents work in; .pi/settings.json sets keepRecentTokens
├── server/            # the API and the pi session manager, node:http only
├── web/               # the Vue lab; bun installs its dependencies
└── tests/             # 201 offline tests on the mock, 10 live tests
justfile               # every recipe; loads .env
```

## Instructions

- Run every check via Bash — do not assume anything is installed.
- Show a status line immediately after each check (pass or fail).
- For auto-installable items (the web dependencies), install without asking.
- For items requiring user input (the API key), ask the user with sensible defaults.
- Do NOT read or display API key values — only confirm they are set.
- Never start `just web` or `just dev` from this command; only verify readiness.
- The app itself has zero runtime dependencies. Only `web/` needs an install.
- Levels 1 to 5 work offline on the mock. Levels 6 to 10 need both `pi` and a TypeSafe key; if either is missing, say so and continue, the rest of the lab still works.

## Workflow

### Step 1 — Check Prerequisites

Gate on the first two; stop and guide the user if either is missing.

1. **Node 24**: `command -v node && node --version`. The levels run as TypeScript natively, which needs Node 22 or later, and 24 is what the repo is tested on. Missing or older: install from https://nodejs.org or `nvm install 24`.
2. **just**: `command -v just`. Missing: `brew install just` or https://github.com/casey/just#installation.

Then the standard tools:

3. **bun**: `command -v bun`. Builds and serves the Vue lab. Missing: `curl -fsSL https://bun.sh/install | bash`.
4. **git**: `command -v git`. Each agent session initializes a git copy of the sandbox so `git diff` works inside it.
5. **pi 0.85.1 or later**: `command -v pi && pi --version`. Runs levels 6 to 10. Missing: `npm install -g @earendil-works/pi-coding-agent`, docs at https://github.com/earendil-works/pi-mono. Not a gate; report it and continue.

### Step 2 — Check Environment

6. Check whether `TYPESAFE_API_KEY` and `LITELLM_API_KEY` are set in the shell or in `ENV_FILE`. Report set or not set, never the value. TypeSafe is the Jev credential. LiteLLM is the agent credential. Do not ask for an OpenRouter key.
7. If either is missing, ask the user to paste that key into `ENV_FILE` themselves, or copy `ENV_SAMPLE` to `ENV_FILE` and tell them which line to fill. With no TypeSafe key, levels 1 to 5 run offline on the mock. With no LiteLLM key, levels 6 to 10 stay unavailable.
8. Optionally note `LITELLM_URL` (default `https://litellm.tikalk.dev/v1`), `JEV_MODEL` (System One model, default `jev-latest`), and `JEV_AGENT_MODEL` (the pi model for levels 6 to 10, default `litellm/open-weight-smart`). Do not ask for them.

### Step 3 — Install Dependencies

9. Run `cd WEB_DIR && bun install`. This is the only install. Report the count of packages from bun's output.

### Step 4 — Verify Configuration

10. `SANDBOX_DIR/.pi/settings.json` exists and contains `keepRecentTokens`. Without it Level 7's compaction never has material.
11. `EXTENSIONS_DIR` contains six files: `report.ts`, `jev-guard.ts`, `jev-compact.ts`, `ask-jev-file.ts`, `ask-jev-files.ts`, `ask-jev.ts`. List any missing.
12. `SANDBOX_DIR/src/domain/billing.ts` contains `Math.floor` on the prorate line. That is the failing test on purpose; if it reads `Math.round` someone fixed the pristine sandbox and levels 7, 9, and 10 lose their bug. Report it, do not change it.
13. `apps/ten-levels/web/public/heroes/` contains ten `level-N.svg` files; if not, note that `just heroes` regenerates them.

### Step 5 — Verify Readiness

14. Run `just test` from the repo root. Expect 201 passing, 0 failures, and 10 live tests skipped; report the pass count. This uses the mock and needs no key.
15. Run `cd SANDBOX_DIR && npm test` and expect exactly one failure, the proration test. Report pass and fail counts.
16. Confirm `just --list` shows `web`, `dev`, `jev1` through `jev10`, `test`, `test-live`, `demo`, `heroes`, `lint`. Do not run `web` or `dev`.
17. If pi is installed, run `pi --version` once more and confirm it prints 0.85.1 or later.

### Step 6 — Report

Show a status table with one row per check above, pass or fail, and one line per item that needs the user's action. Then the ready count, for example `16 of 17 ready`.

Next steps, as commands the user can paste:

```bash
just web            # build and serve the lab on http://127.0.0.1:4399, opens the browser
just jev1           # one level in the terminal, jev1 through jev10; add a, b, or c for one option (just jev4 b)
just test-live      # 10 live tests against LiteLLM, needs LITELLM_API_KEY
just demo           # every level, every option, on the mock
```

If pi or the key is missing, say which levels are unavailable and what to install to unlock them.
