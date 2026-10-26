# PINT FC MVP — Project Rules

We follow the agentic SDLC: requirements → design → session plan → build one
session at a time → release. Each phase writes files into this repo, and the
agent STOPS for the product owner's approval at the end of each phase.

## Stack

- Next.js (App Router) + TypeScript
- Supabase Postgres + Auth
- Vitest (unit), Playwright (end-to-end)
- Hosting: Vercel (owner's account) · Database/Auth: Supabase (owner's project)

Any deviation from this stack must be recorded with a reason in `DECISIONS.md`.

## Secrets

- Never print, log, or commit a token, key, or password.
- Keys live in `.env.local` (gitignored). Check presence only, e.g.:
  `[ -n "$VERCEL_TOKEN" ] && echo set`
- Vercel commands use `--token "$VERCEL_TOKEN"`.
- The Supabase CLI reads `SUPABASE_ACCESS_TOKEN` from the environment.

## Destructive actions

- Never delete files or folders, and never run `git reset --hard`, `git clean`,
  or a force push. If something must go, ask the owner for the exact path
  first.

## Data

- Fake data only: no real names, emails, or phone numbers — anywhere (seed
  data, fixtures, screenshots, test output).

## Before creating cloud resources

- Ask the owner before creating anything in Supabase or Vercel, before any
  action that may cost money, and before any production deploy.

## Testing discipline

- Tests first: write the test, run it, show it failing for the right reason,
  then write the code to make it pass.
- "Done" means the exit gate for the session ran and its output is shown.
- Commit only after the test command itself exits 0 — never through a pipe
  (a pipe can swallow the real exit code).

## Session discipline

- One session at a time, per `plans/session-NN-<name>.md`.
- At the end of a session, append to `PROGRESS.md`: what's done, proof (exit
  gate output), decisions made, and "Next session needs to know".

## Accounts in use

- Supabase project: "Halid's Project" (ref `dgrjyksawdongzxpkjey`, region
  eu-central-1, org `ouobbzccjkbfczowjryj`) — owner's account.
- Vercel team: `halid-s-team` ("Halid's Team", hobby plan) — owner's account.
- The requirements PDF names the instructor's Vercel team/Supabase
  project/screens file — those are ignored. We deploy to the owner's accounts
  above and design our own screens. Where the PDF says "the owner", that is
  the product owner (this repo's user).
