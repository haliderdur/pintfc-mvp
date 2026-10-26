# Progress

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
