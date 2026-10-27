# Test Plan — PINT FC MVP

Author: product/QA pass over the build in `docs/REQUIREMENTS.md`,
`docs/design/screens.md`, `docs/design/rules.md` and the automated suite
already in `tests/`. This document is the **manual/PM-facing test plan**;
it sits above `docs/design/test-map.md`, which is the dev-facing mapping
of each acceptance check to its one automated owning test.

## 1. Objective

Confirm the PINT FC MVP meets all 38 in-scope acceptance checks from
`docs/REQUIREMENTS.md` before each release, and catch regressions in
areas with a history of defects (notably the home page's data-embedding
bugs and card/alignment styling found during UI hardening). Testing
covers functional correctness, data privacy enforcement, responsive/
accessibility gates, and the "live update" behavior of RSVP counts.

## 2. Scope

### In scope

| Area | Screens / endpoints covered |
|---|---|
| Sign-in and sessions | `/sign-in`, header auth state, sign-out / sign-out-everywhere |
| Home page | `/` — next match, season record, latest results, mini league table, squad teaser |
| Squad and profiles | `/squad`, `/players/[id]` |
| Going / Not going (RSVP) | `/fixtures/[id]`, `POST /api/fixtures/[id]/rsvp`, `GET /api/fixtures/[id]/summary` |
| Privacy settings | `/privacy`, `PATCH /api/privacy` |
| Cross-cutting | WCAG AA contrast (AC-5.2), no horizontal scroll at 320px (AC-5.4), the AC-4.3.1 "never leak PII" invariant |

### Out of scope

Everything listed under "Out of scope" in `docs/REQUIREMENTS.md`:
admin console, invites, password reset, MFA, OAuth sign-in, rate
limiting, schedule/calendar pages, waitlists, post-hoc RSVP/kickoff
changes, full standings page, MOTM, store, news/notifications/email,
newsletter, deletion requests, featured blocks, Instagram, reduced
motion, PWA. These are not tested because they are not built.

## 3. Test levels and tools

| Level | Tool | What it's for |
|---|---|---|
| Unit | Vitest (`tests/unit/`) | Pure logic: countdown state, season-record computation |
| Database | Vitest against the real Supabase project (`tests/database/`) | RLS policies, views, cutoff/consent enforcement at the data layer |
| API | Playwright `request` fixture (`tests/api/`) | Route handlers in isolation — RSVP idempotency, consent propagation, stale-cookie rejection |
| End-to-end | Playwright (`tests/e2e/`) | Full browser flows through real screens |
| Manual exploratory | This document's test cases | Visual/UX regressions automated assertions don't catch (contrast *looking* right vs. passing axe, layout shifting, copy/paste artifacts) |

Automated coverage is enforced by `npm run plan-check`
(`scripts/plan-check.mjs`), which fails the build if any of the 38
acceptance checks has zero or more than one owning automated test. This
plan's manual test cases are a **second, independent pass** over the
same checks plus device/browser combinations automation doesn't cover.

## 4. Test environments

| Environment | URL | Data |
|---|---|---|
| Local dev | `http://localhost:3000` (`npm run dev`) | Shared remote Supabase project — no local Supabase |
| Production | `https://halid-pintfc.vercel.app` | Same shared Supabase project (no separate staging DB) |

Both environments point at the **same Supabase project**
(`dgrjyksawdongzxpkjey`). Re-run `npm run seed` before any test pass
that depends on time-relative data (the RSVP cutoff is seeded as "2h
from seed-script run time" — see Risk T1 below).

## 5. Entry criteria

- `npm run seed` has been run and reported success for the environment under test.
- `npx tsc --noEmit`, `npm run build`, `npm run lint` all pass.
- `npm run plan-check` reports 38/38.

## 6. Exit criteria

- All automated suites green: `npm run test` (Vitest), `npx playwright test`.
- All P1 manual test cases in this plan pass; no P1 defect open.
- No AC-4.3.1 (PII leak) defect open, at any priority — this is a hard release blocker regardless of severity elsewhere.
- AC-5.2 (contrast) and AC-5.4 (320px no horizontal scroll) pass on every in-scope screen.

## 7. Test data

Seeded by `scripts/seed.ts` (`npm run seed`, re-run as needed —
idempotent, see `PROGRESS.md` Session 07):

- 40 active fake players (`p01@pintfc.test`–`p40@pintfc.test`, shared
  password in gitignored `seed-logins.md`), including 2 U18 players (one
  with guardian consent + opt-in fields on, one without).
- 1 archived player (must never appear anywhere in the UI or API).
- 1 season, 2 competitions (league + friendly).
- 5 past league results (4 published, 1 deliberately unpublished) + 1
  friendly result.
- Upcoming matches: 1 cancelled, 1 "class demo match" (RSVP cutoff ~2h
  from seed time), 1 later scheduled match.
- 1 standings snapshot (static, no live sync).
- A handful of pre-seeded RSVPs on the demo match.

No real names, emails, or phone numbers anywhere, per `CLAUDE.md`.

## 8. Roles under test

| Role | How to test as this role |
|---|---|
| Visitor (signed out) | Default browser state / incognito window |
| Player (non-minor) | Sign in as e.g. `p01@pintfc.test` |
| Player (minor, no guardian consent) | Sign in as the seeded unconsented U18 (see `seed-logins.md` for which `pNN` this is after seeding) |
| Player (minor, guardian-consented) | Sign in as the seeded consented U18 |
| Second device / second session | A second browser or an incognito window, same player, used together for sign-out-everywhere cases |

## 9. Risks specific to this plan

- **T1 — Time-relative seed data.** The RSVP cutoff and "class demo
  match" are seeded relative to *when the seed script last ran*, not a
  fixed date. A test pass run long after the last seed may find the
  "open" match has silently become "closed." **Mitigation**: re-seed
  immediately before any pass that includes RSVP-cutoff test cases
  (TC-RSVP-04, TC-RSVP-05).
- **T2 — Shared Supabase project, no isolated staging DB.** Manual
  testing writes real rows (RSVPs, privacy toggles) to the same project
  used for demos. **Mitigation**: re-seed after a manual pass that
  changes state, before any real demo.
- **T3 — Visual-only defects don't fail automated tests.** The project
  already hit this twice in practice: the home page silently rendered
  blank opponent/venue names (automated test only asserted
  `not.toHaveText("")`, which a venue/date line alone satisfied) and a
  card-border contrast issue that passed axe's threshold but was still
  hard to see. **Mitigation**: this plan's manual test cases explicitly
  check that specific expected text/values are visible, not just "the
  element has some text."

## 10. Schedule

Run against local dev during active development; run the full manual
pass against production immediately before any class demo and after any
UI-affecting change, per `CLAUDE.md`'s session discipline (exit-gate
proof recorded in `PROGRESS.md`).
