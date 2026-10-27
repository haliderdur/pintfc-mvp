# Progress

## Session 05 — Privacy settings (2026-10-27)

### Done

- `PATCH /api/privacy` (`app/api/privacy/route.ts`): updates only the
  caller's own `player_consents` row; reuses `canEditOwnConsent()` from
  `lib/rules/visibility.ts` (already present from Session 01) to return
  `403 FORBIDDEN_MINOR_CONSENT` when a minor without guardian consent
  tries to turn a field **on** (off is always allowed); `400
  VALIDATION_ERROR` for an unknown field or non-boolean value.
- `/privacy` page (`app/privacy/page.tsx` + `PrivacyForm.tsx`): redirects
  to `/sign-in` if signed out; three toggles
  (`privacy-toggle-photo/nationality/stats`) with saving/`privacy-saved`/
  `privacy-error` states; renders all three disabled as
  `privacy-toggle-*-locked` with an explanatory note when the player
  `is_minor && !guardian_consent`, per `screens.md`.
- `app/privacy/loading.tsx` / `error.tsx`, matching the convention from
  `/squad` and `/fixtures/[id]`.
- Confirmed the toggle takes effect immediately on `/players/[id]`
  (Session 04's page) via `lib/profile/get-profile.ts`, which already
  reads live from `public_profile` — no caching to work around.
- Found and fixed a bug in this session's own API test while writing it
  (not a product bug): the first draft fetched the public profile page
  reusing the same signed-in player's cookies used to PATCH their own
  consent, which hits the "viewing your own profile" path (AC-4.3.3,
  always-visible) and masked whatever the real public-view result was.
  Fixed by fetching through a separate, signed-out `APIRequestContext`
  (`tests/api/privacy.spec.ts`).
- Found and fixed two pre-existing issues unrelated to this session's
  code while running its exit gate: `npm run lint` failed on
  `scripts/mcp-env.cjs`'s intentional `require()` calls (added it to
  `eslint.config.mjs`'s `globalIgnores` — it's a plain Node CJS utility
  script, not app source); and `tests/database/rsvp-rules.test.ts` failed
  because the seeded "open" match's RSVP cutoff had passed relative to
  today's date (re-ran `npm run seed`, per the stale-seed gotcha flagged
  in Session 01's notes below).

### Proof (exit gate)

```
$ npx tsc --noEmit
(no output — exit 0)

$ npm run build
✓ Compiled successfully
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/sign-in
├ ƒ /api/auth/sign-out
├ ƒ /api/auth/sign-out-all
├ ƒ /api/fixtures/[id]/rsvp
├ ƒ /api/fixtures/[id]/summary
├ ƒ /api/privacy
├ ƒ /fixtures/[id]
├ ƒ /players/[id]
├ ƒ /privacy
├ ƒ /sign-in
└ ƒ /squad

$ npm run plan-check
plan-check passed: 38/38 acceptance checks, each with exactly one owning test.

$ npm run test
 Test Files  6 passed (6)
      Tests  19 passed (19)

$ npm run lint
(no errors or warnings — exit 0)

$ npx playwright test
  29 passed (51.1s)
```

### Decisions made this session

None new — built directly on D1–D17, using the `canEditOwnConsent()` /
`player_consents_self_update` RLS policy already in place from Session
01.

### Next session needs to know

- Session 05's owned ACs (AC-4.3.2, AC-4.3.4) are done; all 38 ACs now
  have an owning test.
- `scripts/mcp-env.cjs` is now excluded from `eslint.config.mjs` by path
  rather than by in-file disable comments — if more `.cjs` utility
  scripts are added later, extend that same ignore entry rather than
  re-adding per-line disables.
- Re-seed (`npm run seed`) before the next session starts if any
  time-relative database test fails for no code reason — same gotcha as
  Session 01/04, now hit a second time.

## Session 04 — Squad and profiles (2026-10-26)

### Done

- `/squad` (`app/squad/page.tsx`): all active players from `public_players`,
  grouped by position (GK/DEF/MID/FWD), each a `squad-player-{id}` link to
  `/players/[id]`. Archived-player exclusion already enforced by the
  view (Session 01) — this just renders its rows.
- `/players/[id]` (`app/players/[id]/page.tsx`): reads `public_profile`,
  real 404 (`notFound()`) for an archived or unknown id. Renders only
  consent-visible fields (`profile-field-photo`, `profile-field-nationality`,
  `profile-field-stats`), always `profile-name`/`profile-number`/
  `profile-position`.
- `lib/profile/get-profile.ts` — one `getPlayerProfile()` function shared
  by self-view and public-view (plan task 3, not two code paths): reads
  `public_profile` for everyone, then for a signed-in caller viewing
  their own id, re-reads their raw `players` row (allowed only for their
  own row by the `players_self_select` RLS policy from Session 01) and
  runs it through `visiblePlayerFields()`'s `viewerIsSelf` branch instead
  — AC-4.3.3. Never selects `dob`/`email`/`phone` at all, from either
  path (AC-4.3.1).
- Found this session's "api-level" tests (AC-4.2.1, AC-4.3.1, AC-4.3.3)
  don't need a Route Handler to exist — `/players/[id]` has none (it's a
  Server Component reading the view directly, per `api.md`) — so they
  call `getPlayerProfile()` directly with real Supabase clients
  (`tests/database/profile-privacy.test.ts`), matching Session 01's
  database-test style rather than going through Playwright.
- Re-seeded (`npm run seed`) partway through this session: Session 01's
  `tests/database/rsvp-rules.test.ts` started failing because the
  "earliest scheduled match" it picks had crossed its 2h RSVP cutoff in
  real time since Session 01 was seeded (D9) — an idempotent reseed, not
  a code fix, resolved it. Unrelated to this session's own changes.
- Fixed a pre-existing gap in `eslint.config.mjs` found while verifying
  this session: its `globalIgnores` override replaces
  `eslint-config-next`'s defaults wholesale and didn't re-add
  `playwright-report/`/`test-results/`, so once real Playwright trace
  viewer assets existed there, `npm run lint` tried to lint that bundled
  (minified) JS as app code. Added both to the ignore list.

### Proof (exit gate)

```
$ npx tsc --noEmit
(no output — exit 0)

$ npm run build
✓ Compiled successfully
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/sign-in
├ ƒ /api/auth/sign-out
├ ƒ /api/auth/sign-out-all
├ ƒ /api/fixtures/[id]/rsvp
├ ƒ /api/fixtures/[id]/summary
├ ƒ /fixtures/[id]
├ ƒ /players/[id]
├ ƒ /sign-in
└ ƒ /squad

$ npm run test
 ✓ tests/unit/countdown.test.ts (4 tests)
 ✓ tests/unit/season-record.test.ts (2 tests)
 ✓ tests/database/results-view.test.ts (2 tests)
 ✓ tests/database/privacy-views.test.ts (4 tests)
 ✓ tests/database/rsvp-rules.test.ts (3 tests)
 ✓ tests/database/profile-privacy.test.ts (4 tests)
 Test Files  6 passed (6)
      Tests  19 passed (19)

$ npm run plan-check
plan-check passed: 38/38 acceptance checks, each with exactly one owning test.

$ npm run lint
(no errors or warnings — exit 0)

$ npx playwright test
  27 passed (48.7s)
```

### Decisions made this session

None new — built directly on D1–D17.

### Next session needs to know

- Session 05 (privacy settings) can read `visiblePlayerFields()` /
  `canEditOwnConsent()` from `lib/rules/visibility.ts` directly — no
  further plumbing needed. It will also need its own self-only Route
  Handler (`PATCH /api/privacy` per `api.md`), unlike this session's
  read-only pages.
- `lib/profile/get-profile.ts` is the one place profile field
  visibility is decided in app code — reuse it rather than re-querying
  `public_profile`/`players` directly from a new page.
- If a database/vitest test that reads "the earliest scheduled match"
  or similar time-relative seed state starts failing for no code
  reason, re-seed first (D9) before assuming a regression.

## Session 06 — RSVP and fixture page (2026-10-26)

### Done

- `GET /api/fixtures/[id]/summary` and `POST /api/fixtures/[id]/rsvp`
  Route Handlers (`app/api/fixtures/[id]/summary|rsvp/route.ts`), plus
  `lib/fixtures/get-summary.ts` (counts always, `roster` only for a
  signed-in caller — D7/Q5).
- `/fixtures/[id]` page (`app/fixtures/[id]/page.tsx` +
  `FixtureRsvpPanel.tsx`): visitors see counts only; signed-in players
  get the roster plus `fixture-rsvp-going/maybe/not-going` controls
  (disabled `fixture-rsvp-closed` once the cutoff passes).
- `lib/hooks/usePolling.ts` — shared 10s-interval polling hook (pauses
  off `document.visibilitychange`), used here for the summary endpoint
  and written to be reusable by any future live screen.
- Resubmitting an RSVP replaces the previous answer via the
  `(match_id, player_id)` unique constraint from Session 01 (upsert,
  not insert) — AC-3.3.2.
- Found and fixed two bugs in this session's own Playwright specs
  while verifying them (not product bugs): `tests/e2e/fixtures.spec.ts`
  was missing the `.env.local` load that `createServiceRoleClient()`
  needs in the test process, and its `signIn()` helper clicked submit
  and immediately navigated away without waiting for the client-side
  sign-in fetch + `router.push("/")` to finish setting the session
  cookie (`tests/e2e/fixtures.spec.ts`, `signIn()`).

### Proof (exit gate)

```
$ npx tsc --noEmit
(no output — exit 0)

$ npm run build
✓ Compiled successfully in 296ms
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/sign-in
├ ƒ /api/auth/sign-out
├ ƒ /api/auth/sign-out-all
├ ƒ /api/fixtures/[id]/rsvp
├ ƒ /api/fixtures/[id]/summary
├ ƒ /fixtures/[id]
└ ƒ /sign-in

$ npx playwright test tests/e2e/fixtures.spec.ts
  ✓ AC-3.3.1 a signed-in player can RSVP Going, Maybe or Not going before the cutoff
  ✓ AC-3.3.5 a signed-out visitor cannot see or use the RSVP control
  ✓ AC-3.4.1 the open fixture page shows RSVP counts without requiring sign-in
  ✓ AC-3.4.3 fixture page counts update within 15 seconds of another player's RSVP change
  4 passed (26.6s)
```

### Decisions made this session

See `DECISIONS.md` D17 (this session was built together with Session
03 instead of strictly one-at-a-time; recorded, not unwound).

### Next session needs to know

- `usePolling` is generic (`lib/hooks/usePolling.ts`) — reuse it rather
  than writing a new polling hook for any later live-updating screen.
- Session 04 (squad/profiles) and Session 05 (privacy) have not been
  started; go back to one-session-at-a-time for those (D17).

## Session 03 — Home page (2026-10-26)

### Done

- `/` (`app/page.tsx`): next-match card (opponent/venue/local kickoff),
  live countdown via `components/NextMatchCountdown.tsx` +
  `lib/countdown.ts` (client component, no reload), `Cancelled` badge
  instead of a countdown for a cancelled next match, "no upcoming
  match" empty state.
- Season record + latest results read from `public_match_results`
  (already publish-filtered by Session 01's view) via
  `lib/season-record.ts`, most-recent-first, with an empty state when
  there are zero published results.
- Mini league table from `standings_snapshot`, PINT FC's row
  visually distinguished (`styles.pintFcRow`).
- Squad teaser (6 players from `public_players`) linking to `/squad`
  (Session 04 — `/squad` 404ing until then is expected, per the
  session plan).
- `app/loading.tsx` / `app/error.tsx` for the loading skeleton and
  generic retry state.
- `lib/season-record.ts` / `lib/countdown.ts` unit-tested in isolation
  (`tests/unit/season-record.test.ts`, `tests/unit/countdown.test.ts`)
  for AC-2.2.1 and AC-2.1.6, which don't need a live DB or clock.
- Fixed 3 racy Playwright assertions in `tests/e2e/home.spec.ts`
  (AC-2.1.1, AC-2.1.4, AC-2.2.4) found while verifying this session:
  they called `.isVisible()` synchronously right after `page.goto("/")`,
  racing the page's async Server Component data fetch. Added
  `waitForNextMatchSettled`/`waitForResultsSettled` helpers that wait
  for one of the two mutually-exclusive terminal markers first.

### Proof (exit gate)

```
$ npx tsc --noEmit
(no output — exit 0)

$ npm run build
✓ Compiled successfully in 296ms

$ npm run test
 ✓ tests/unit/season-record.test.ts (2 tests)
 ✓ tests/unit/countdown.test.ts (4 tests)
 ✓ tests/database/results-view.test.ts (2 tests)
 ✓ tests/database/privacy-views.test.ts (4 tests)
 ✓ tests/database/rsvp-rules.test.ts (3 tests)
 Test Files  5 passed (5)
      Tests  15 passed (15)

$ npm run plan-check
plan-check passed: 38/38 acceptance checks, each with exactly one owning test.

$ npm run lint
(no errors or warnings — exit 0)

$ npx playwright test tests/e2e/home.spec.ts
  25 passed (43.8s)
```

### Decisions made this session

See `DECISIONS.md` D16 (`home_score` is always PINT FC's own score) and
D17 (built together with Session 06 instead of strictly one-at-a-time).

### Next session needs to know

- A single run of the full Playwright suite can show one transient
  `502 Bad Gateway (cloudflare)` from the real Supabase project under
  load (observed once during this session, passed on retry) — this
  matches Session 02's documented note about transient failures against
  the shared remote project; retry before assuming a code regression.
- Session 04 (squad/profiles) can build on `public_players` /
  `public_profile` directly; the squad teaser's `/squad` link already
  expects that route to exist.

## Session 02 — Auth and sessions (2026-10-26)

### Done

- `lib/supabase/server.ts` (Server Component / Route Handler client) and
  `lib/supabase/middleware.ts` + `proxy.ts` (session-cookie refresh on
  every request) using `@supabase/ssr`.
- `/sign-in` page and `POST /api/auth/sign-in` / `sign-out` /
  `sign-out-all` Route Handlers, matching `docs/design/api.md` exactly
  (request/response shapes, generic `INVALID_CREDENTIALS` message).
- Shared header (`components/Header.tsx` + `HeaderAuthControls.tsx`):
  `header-signin` link when signed out; player name + `header-signout`
  + `header-signout-all` when signed in.
- `lib/api/error-response.ts` — the one `{ error: { code, message } }`
  shape every Route Handler now returns (rules.md §4), reused going
  forward.
- Turned off Next.js Cache Components (D14) and renamed `middleware.ts`
  to `proxy.ts` (D15) — both needed for the build to succeed with this
  app's all-dynamic, cookie-reading pages.

### Proof (exit gate)

```
$ npx tsc --noEmit
(no output — exit 0)

$ npm run lint
(no errors or warnings — exit 0)

$ npm run build
✓ Compiled successfully in 279ms
Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/auth/sign-in
├ ƒ /api/auth/sign-out
├ ƒ /api/auth/sign-out-all
└ ƒ /sign-in
ƒ Proxy (Middleware)

$ npm run test
 ✓ tests/database/results-view.test.ts (2 tests)
 ✓ tests/database/privacy-views.test.ts (4 tests)
 ✓ tests/database/rsvp-rules.test.ts (3 tests)
 Test Files  3 passed (3)
      Tests  9 passed (9)

$ npm run plan-check
plan-check passed: 38/38 acceptance checks, each with exactly one owning test.

$ npm run test:e2e
 ✓ AC-1.6.4 a stale session cookie after sign-out grants no player privileges
 ✓ AC-1.1.1 a seeded player can sign in with their fake credentials
 ✓ AC-1.1.3 sign-in is rejected for wrong credentials with a generic error
 ✓ AC-1.1.4 a signed-in player stays signed in across a reload
 ✓ AC-1.6.1 sign out ends the session on this device
 ✓ AC-1.6.2 sign out of all devices revokes every session
 ✓ AC-1.6.3 signing out of all devices invalidates a second device's session
 7 passed (17.6s)
```

### Decisions made this session

See `DECISIONS.md` D14 (Cache Components off) and D15 (`proxy.ts`
rename).

### Next session needs to know

- **Playwright tests sign in against the real Supabase Auth project**
  (no local instance — D12). A burst of sign-ins can transiently hit
  Supabase's own rate limit (observed once, passed on retry); the
  config now has `retries: 1` for this. If `npm run test:e2e` fails with
  `signin-error` showing for a seeded player that should have valid
  credentials, retry before assuming a code regression.
- The shared header (`components/Header.tsx`) and `/sign-in` are
  intentionally unstyled beyond `data-testid` hooks — Session 07 is
  where the "Sport" look and the contrast/320px gates get applied
  across every screen, not per-session.
- Sessions 03–06 can now use `createServerSupabaseClient()` /
  `errorResponse()` directly; no further auth plumbing is needed before
  starting them.

## Session 01 — Foundation: schema, RLS, views, seed (2026-10-26)

### Done

- Next.js App Router + TypeScript scaffold (`app/`, `next.config.ts`,
  `tsconfig.json`, eslint config), merged into the existing repo without
  disturbing `CLAUDE.md`/`DECISIONS.md`/`docs/`/`plans/`.
- Full schema migration (`supabase/migrations/20261026000000_initial_schema.sql`):
  12 base tables, RLS enabled and default-deny on every one, 6 public-safe
  views (`public_players`, `public_profile`, `public_match_results`,
  `public_player_stat_lines`, `public_rsvp_counts`, `player_rsvp_roster`),
  and the RLS policies for `players`/`player_consents`/`rsvps` self-access
  + cutoff/ownership checks. Applied to the real Supabase project
  (`dgrjyksawdongzxpkjey`) — see D12/D13 in `DECISIONS.md`.
- `lib/rules/cutoff.ts`, `lib/rules/visibility.ts`, `lib/rules/permissions.ts`
  — TypeScript mirrors of the DB rules, for later UI/API reuse.
- `scripts/seed.ts` — idempotent truncate + reseed: 40 active players
  (incl. 2 U18s, one guardian-consented, one not) + 1 archived player,
  1 season/2 competitions, 5 past league results (4 published, 1 not) +
  1 published friendly result, 1 cancelled + 1 class-demo + 1 later
  upcoming match, 2 trainings, 1 standings snapshot, 5 seed RSVPs. Fake
  logins written only to gitignored `seed-logins.md`, never printed to
  the console or committed. Verified idempotent (ran twice, exact same
  row counts both times).
- `scripts/plan-check.mjs` — parses `docs/design/test-map.md`, fails if
  any of the 38 ACs has zero or more than one owning test.
- Database-level test suite (`tests/database/*.test.ts`, Vitest) covering
  this session's 6 owned ACs: AC-2.2.2, AC-2.4.2, AC-3.3.4, AC-3.3.6,
  AC-4.1.2, AC-4.2.2.

### Proof (exit gate)

```
$ npx tsc --noEmit
(no output — exit 0)

$ npm run build
✓ Compiled successfully in 465ms
✓ Generating static pages using 5 workers (4/4)

$ npm run plan-check
plan-check passed: 38/38 acceptance checks, each with exactly one owning test.

$ npm run test
 ✓ tests/database/results-view.test.ts (2 tests)
 ✓ tests/database/privacy-views.test.ts (4 tests)
 ✓ tests/database/rsvp-rules.test.ts (3 tests)
 Test Files  3 passed (3)
      Tests  9 passed (9)

$ npm run lint
(no errors or warnings — exit 0)
```

### Decisions made this session

See `DECISIONS.md` D12 (no local Supabase; tests run against the shared
remote project) and D13 (Management API fallback for schema writes when
the access token lacked `database_write` scope).

### Next session needs to know

- **Env**: `.env.local` now has all 5 vars set (`VERCEL_TOKEN`,
  `SUPABASE_ACCESS_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). The
  access token now has `database_write` scope — if `supabase db push`
  ever reports a missing-permission error again, re-check the token's
  scopes before assuming a database issue.
- **No Docker in this environment.** Local Supabase (`supabase start`)
  isn't available; all dev/testing against Supabase happens on the real
  project. Re-seed before any class demo (T7) and avoid exercising
  writes against it casually close to a demo.
- **Fake player logins**: one shared fake password for all 40 seeded
  players, in gitignored `seed-logins.md` (regenerate by running
  `npm run seed` — it's rewritten every run, never committed).
- **Q1/Q3 from `docs/REQUIREMENTS.md` are still open** (real class date/
  time; confirmed Supabase plan tier). Defaults are in effect: the class
  demo match's cutoff is "2h from seed-script run time," which means
  re-running `npm run seed` shortly before any real demo is required for
  that cutoff to land correctly during the session.
- Session 02 (auth) can now build directly on the 40 real `auth.users`
  rows and the `players`/`player_consents` tables/policies from this
  session — nothing further needed from Session 01 before starting it.
