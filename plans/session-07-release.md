# Session 07 — Release gate

## Goal

No new features. Verify the two cross-cutting design gates
(`docs/REQUIREMENTS.md`'s "Design gates kept") hold across every screen
built in Sessions 02–06, run the full test suite together, re-seed, and
deploy — the actual release step of the SDLC.

## Scope

Not an AC owner (all 38 are already owned per `plans/00-backlog.md`).
This session is verification + deployment:

- AC-5.2 (WCAG AA contrast) and AC-5.4 (no horizontal scroll at 320px) —
  both named as release gates in `docs/REQUIREMENTS.md`, checked here
  across `/`, `/squad`, `/players/[id]`, `/fixtures/[id]`, `/sign-in`,
  `/privacy`, not owned by any single AC row in `test-map.md`.

## Tasks

1. Full suite: `node scripts/plan-check.mjs` (38/38 owned), Vitest unit +
   database + api levels, Playwright e2e — all together, not per-session
   subsets.
2. Contrast check (automated, e.g. axe) on all six screens above.
3. 320px-width check (no horizontal scroll) on all six screens.
4. Re-run `scripts/seed.ts` against the shared Supabase project
   immediately before any class/demo (`threats.md` T7, `architecture.md`
   environments table) — confirm it's idempotent (truncate + reseed
   twice in a row produces identical counts).
5. Confirm Vercel preview/production env vars are set (`vercel env ls`
   — presence only, never print values, per CLAUDE.md secrets rule) and
   Deployment Protection is off for preview if students need
   unauthenticated preview access (Risk R6) — **ask the owner before any
   change to deployment protection or production deploy**, per
   CLAUDE.md's "before creating cloud resources" rule.
6. Deploy to Vercel preview, smoke-test against the preview URL, then
   (owner's explicit go only) promote to production.

## Exit gate

- Every command in Tasks 1–4 exits 0; full output shown in `PROGRESS.md`.
- Preview URL smoke-tested manually or via Playwright against the
  deployed URL, not just `localhost`.

## Depends on

Sessions 01–06 all complete and each one's own exit gate already green.
