---
description: Install 10 Levels of Jev — prerequisites, web dependencies, TypeSafe key, pi agentic levels, first offline test run
---

# Install 10 Levels of Jev

## Purpose

Set up the 10 Levels of Jev lab for development. Check the toolchain (Node 24, bun, just, pi), install the Vue lab's dependencies, confirm the Jev credential without displaying it, verify the sandbox and pi settings the agentic levels depend on, and run the offline suite. This is an interactive, agentic process — ask the user for choices only when needed.

## Variables

- SOURCE_REPO: the directory this command runs in
- APP_DIR: `apps/ten-levels`
- WEB_DIR: `apps/ten-levels/web`
- SANDBOX_DIR: `apps/ten-levels/sandbox`
- EXTENSIONS_DIR: `apps/ten-levels/extensions`
- ENV_FILE: `.env` at the repo root (loaded by the justfile)
- ENV_SAMPLE: `.env.sample`

## Codebase structure

```
apps/ten-levels/
├── src/core/      # Jev wire contract + client (mock, TypeSafe)
├── src/levels/    # level01 .. level10, one file per option
├── extensions/    # pi extensions for levels 6-10, plus report.ts
├── sandbox/       # the repo agents work in; .pi/settings.json sets keepRecentTokens
├── server/        # the API + pi session manager, node:http only
├── web/           # the Vue lab; bun installs its dependencies
└── tests/         # 201 offline tests on the mock, 10 live tests
justfile           # every recipe; loads .env
```

Agent inference runs through the LiteLLM proxy (`LITELLM_API_KEY`, model `litellm/open-weight-smart` — already wired in the global OpenCode config and `.pi/models.json`). Jev decisions run through the TypeSafe API (`TYPESAFE_API_KEY`).

## Instructions

- Run every check via Bash — do not assume anything is installed.
- Show a status line immediately after each check (pass / fail).
- For auto-installable items (the web dependencies), install without asking.
- For items requiring user input (the API key), ask the user with sensible defaults.
- Do NOT read or display API key values — only confirm they are set.
- Never start `just web` or `just dev` from this command; only verify readiness.
- The app itself has zero runtime dependencies. Only `web/` needs an install.
- Levels 1-5 work offline on the mock. Levels 6-10 need both `pi` and the TypeSafe key; when either is missing, say so and continue, the rest of the lab still works.

## Workflow

### Step 1 — Check prerequisites

Gate on the first two; stop and guide the user when either is missing.

1. **Node 24**: `command -v node && node --version`. The levels run TypeScript natively, which needs Node 22 or later, 24 is what the repo is tested on. When missing or older: install from https://nodejs.org or `nvm install 24`.
2. **just**: `command -v just`. When missing: `brew install just` or https://github.com/casey/just#installation.

Standard tools:

3. **bun**: `command -v bun`. Builds and serves the Vue lab. When missing: `curl -fsSL https://bun.sh/install | bash`.
4. **git**: `command -v git`. Each agent session initializes a git copy of the sandbox so `git diff` works inside it.
5. **pi 0.85.1 or later**: `command -v pi && pi --version`. Runs levels 6-10. When missing: `npm install -g @earendil-works/pi-coding-agent`, docs at https://github.com/earendil-works/pi-mono. Not a gate; report and continue.

### Step 2 — Check environment

6. Check whether `TYPESAFE_API_KEY` is set in the shell or in `ENV_FILE`: `grep -q '^TYPESAFE_API_KEY=' .env 2>/dev/null || [ -n "$TYPESAFE_API_KEY" ]`.
7. When no key: offer to create `ENV_FILE` from `ENV_SAMPLE`, then ask the user to get a TypeSafe key (https://typesafe.ai). Never write a key the user did not provide — leave the `ENV_FILE` value blank for them to fill. When there is no key, say levels 1-5 run offline on the mock and levels 6-10 stay unavailable until a key exists.
8. Optionally note `LITELLM_API_KEY` (LiteLLM proxy for agent inference, used by pi on levels 6-10) and `JEV_AGENT_MODEL` (the pi model for levels 6-10, default `litellm/open-weight-smart`). Do not ask for them.

### Step 3 — Install dependencies

9. Run `cd WEB_DIR && bun install`. This is the only install. Report the count of packages from bun's output.

### Step 4 — Verify configuration

10. `SANDBOX_DIR/.pi/settings.json` exists and contains `keepRecentTokens`. Without it Level 7's compaction never materializes.
11. `EXTENSIONS_DIR` contains the six files: `report.ts`, `jev-guard.ts`, `jev-compact.ts`, `ask-jev-file.ts`, `ask-jev-files.ts`, `ask-jev.ts`. List any missing.
12. `SANDBOX_DIR/src/domain/billing.ts` contains `Math.floor` on the prorate line. That is the failing test on purpose; when it reads `Math.round` someone fixed the pristine sandbox and levels 7, 9, 10 lose their bug. Report it, do not change it.
13. `apps/ten-levels/web/public/heroes/` contains the ten `level-N.svg` files; when not, note `just heroes` regenerates them.

### Step 5 — Verify readiness

14. Run `just test` from the repo root. Expect 201 passing, 0 failures, the 10 live tests skipped; report the pass count. The suite uses the mock and needs no key.
15. Run `cd SANDBOX_DIR && npm test` and expect exactly one failure, the proration test. Report the pass/fail counts.
16. Confirm `just --list` shows `web`, `dev`, `jev1` through `jev10`, `test`, `test-live`, `demo`, `heroes`, `lint`. Do not run `web` or `dev`.
17. When pi is installed, run `pi --version` once more and confirm it prints 0.85.1 or later.

Close with the four commands in this order:

```bash
just web       # build and serve the lab on http://127.0.0.1:4399, opens the browser
just jev1      # one level in the terminal, jev1 through jev10; add a, b, or c for one option (just jev4 b)
just test-live # 10 live tests against real Jev, needs TYPESAFE_API_KEY
just demo      # every level, every option, on the mock
```

When pi or the key is missing, say which levels are unavailable and that install is what unlocks them.
