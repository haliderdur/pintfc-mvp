# Session 03 — Home page

## Goal

Build `/` per `docs/design/screens.md`: next-match card with countdown,
season record, latest results, mini league table, squad teaser — all read
directly in Server Components from Session 01's public-safe views.

## Scope (owned ACs)

AC-2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.1.5, 2.1.6, 2.2.1, 2.2.3, 2.2.4, 2.3.1,
2.3.2, 2.4.1, 2.4.3 (13 ACs; 2.1.6 and 2.2.1 are `unit`, the rest `end-to-end`
per `test-map.md`).

## Tasks

1. Next-match section: opponent/venue/local kickoff time, live countdown
   (client component, no full reload), cancelled-match "Cancelled" badge
   instead of countdown (D: Q4 default — AC-2.1.3), "no upcoming match"
   empty state (AC-2.1.4), countdown-at-zero → started/passed state
   (AC-2.1.6, unit-tested in isolation from the clock).
2. Season record + latest results: computed/read from published-only
   `match_results` (Session 01's view already excludes unpublished —
   AC-2.2.2 is already covered; this session just reads it correctly),
   most-recent-first list, empty state when zero published results.
3. Mini league table: static `standings_snapshot` read, PINT FC's row
   visually distinguished.
4. Squad teaser: subset of `public_players`, links to `/squad` (built in
   Session 04 — teaser can link ahead; `/squad` returning 404 until then
   is expected and does not block this session's own exit gate).
5. Loading skeletons and `home-error` generic retry state.
6. 320px width check (ties to AC-2.1.5 and the release-wide AC-5.4 gate
   finalized in Session 07).

## Exit gate

- Playwright e2e covering every row above except 2.1.6/2.2.1.
- Vitest unit tests for AC-2.1.6 (countdown reaching zero) and AC-2.2.1
  (record computed from published results only, given a fixed fixture
  array — no live DB needed).
- Viewport test at 320px width, no horizontal scroll, on `/`.
- `npm run build` exit 0; output shown in `PROGRESS.md`.

## Depends on

Session 01 (seed data, views). Does not depend on Session 02 (home page
has no signed-in-only content).
