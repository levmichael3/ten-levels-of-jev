# Jevbridge MCP: wire-up + usage

Jevbridge turns Jev into MCP tools any host can call: `jev_decide` (typed answers on one
state), `jev_gate` (execute/confirm/escalate/abort on computed answers), `jev_computer_use`
(next GUI action from a closed set), `jev_recipe` (built-in recipes). The generating model
keeps writing; Jevbridge decides.

Upstream: https://github.com/tacticocc/Jevbridge (MIT, 9 commits, zero runtime deps, Node 22+).

## What we did here

1. Vendored Jevbridge to `.opencode/jevbridge/` (src, skills, examples, package.json).
   No git tracking there — global ignore covers `.opencode/**`, so this is local-only.
2. Added project `opencode.json` with a local `jevbridge` MCP server. The key comes from
   your shell env via `{env:TYPESAFE_API_KEY}` — never written in the file. Same pattern
   the docs use for Context7 (`{env:CONTEXT7_API_KEY}`).
3. Verified live: `jev_decide` on `kubectl delete pvc data-postgres-0 -n production`
   returned backend `jev`, model `jev-1.13.0`, `is_destructive` noul 0.85, gate `confirm`.

## How to use (OpenCode)

Prereqs: Node 22+, `TYPESAFE_API_KEY` exported in the shell that launches OpenCode.

```bash
export TYPESAFE_API_KEY=ts_...
opencode   # project opencode.json auto-loads; jevbridge tools appear as jevbridge_*
```

Then prompt with intent, e.g. "use jevbridge to gate this rm -rf before running it".
Without a key, backend falls to `auto` → LLM adapter → heuristic keyword scorer. That is a
smoke test, not a safety signal.

## How it maps to direct-jev

- Skill (`skills/direct-jev/`) = when to ask, which recipe, what threshold.
- MCP (`jev_decide`/`jev_gate`) = the typed call + confidence gate, no SDK to copy.
- Thresholds stay with the caller: `confirm` asks, `execute` runs, `abort` blocks.

Example: `jev_decide` with a noul "Does this command destroy data?" → `noul 0.85` →
gate `confirm` → ask before executing. Level 6 hooks (`jev-guard.ts`) remain the hard
gate inside the lab; the MCP is cooperative in a chat session.

## Key handling

- `opencode.json` holds `{env:TYPESAFE_API_KEY}`, resolved from your environment at launch.
- `justfile` has `dotenv-load`, so `just jev1` reads `.env`; OpenCode MCP does not read
  `.env` — export the key in the launching shell.
- Never print keys. Never commit `.env`.
