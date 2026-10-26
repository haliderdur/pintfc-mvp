# Session 02 — Auth and sessions

## Goal

Email+password sign-in for seeded fake players via `@supabase/ssr`,
sign-out, and sign-out-of-all-devices (Supabase global sign-out), plus the
shared header's signed-in/signed-out states. Depends on Session 01's seeded
`auth.users` rows.

## Scope (owned ACs)

AC-1.1.1, AC-1.1.3, AC-1.1.4, AC-1.6.1, AC-1.6.2, AC-1.6.3, AC-1.6.4
(all end-to-end per `test-map.md`, except AC-1.6.4 which is `api`).

## Tasks

1. `/sign-in` page (`signin-email`, `signin-password`, `signin-submit`,
   `signin-error`) per `docs/design/screens.md`.
2. `POST /api/auth/sign-in`, `/sign-out`, `/sign-out-all` per `api.md`
   exactly (request/response shapes, error codes `INVALID_CREDENTIALS`,
   generic message — no user enumeration).
3. `@supabase/ssr` session cookies: httpOnly, `Secure`, `SameSite=Lax`,
   scoped to the deployment domain (`architecture.md`).
4. Shared header component: `header-signin` when signed out;
   player name + `header-signout` + `header-signout-all` when signed in.
5. Sign-out-all calls Supabase's global/`scope: 'global'` sign-out so
   every device's refresh token is revoked, not just this cookie
   (`threats.md` T5).

## Exit gate

- Playwright e2e: AC-1.1.1, 1.1.3, 1.1.4, 1.6.1, 1.6.2, 1.6.3 — including
  the two-device scenario for 1.6.2/1.6.3 (two browser contexts, same
  seeded player).
- API-level test for AC-1.6.4: a stale cookie after either sign-out grants
  no player-only route access.
- `npm run lint && npm run build` exit 0.
- Full exit-gate command's output shown in `PROGRESS.md`.

## Depends on

Session 01 (seeded players + auth users must exist).
