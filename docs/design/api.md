# API

Next.js Route Handlers only exist where a client component needs a stable
JSON contract (auth actions, writes, polling). Everything else is read
directly in Server Components against the public-safe views in `data.md`.

## Error format (shared by every endpoint)

```json
{
  "error": {
    "code": "RSVP_CUTOFF_PASSED",
    "message": "RSVP closed for this match."
  }
}
```

Known codes: `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `RSVP_CUTOFF_PASSED`,
`NOT_FOUND`, `FORBIDDEN_MINOR_CONSENT`, `VALIDATION_ERROR`.

## Endpoints

### `POST /api/auth/sign-in`
- Request: `{ "email": string, "password": string }`
- 200: `{ "player": { "id": string, "fullName": string } }`, sets session
  cookies.
- 401 `INVALID_CREDENTIALS`: bad email/password (generic message, no
  user-enumeration — AC-1.1.3).

### `POST /api/auth/sign-out`
- No body. Ends the current device's session.
- 204, clears session cookies (AC-1.6.1).

### `POST /api/auth/sign-out-all`
- No body. Revokes every session for the signed-in player (Supabase global
  sign-out).
- 204, clears session cookies on this device too (AC-1.6.2, 1.6.3).

### `GET /api/fixtures/[id]/summary`
- Public (no auth required) — polled every 10s by the fixture page while
  visible (AC-3.4.3).
- 200: `{ "going": number, "maybe": number, "notGoing": number, "cutoffAt": string, "isOpen": boolean, "roster": [{ "playerId": string, "fullName": string, "answer": "going"|"maybe"|"not_going" }] | null }`
  — `roster` is `null` for an unauthenticated caller (visitor sees counts
  only, per Q5/D7); populated for a signed-in player.
- 404 `NOT_FOUND`: unknown fixture id.

### `POST /api/fixtures/[id]/rsvp`
- Request: `{ "answer": "going" | "maybe" | "not_going" }`
- Requires a player session.
- 200: `{ "answer": "going" | "maybe" | "not_going", "updatedAt": string }`
  (AC-3.3.1, 3.3.2, 3.3.6).
- 401 `UNAUTHENTICATED`: no/invalid session (AC-3.3.5 — visitors never reach
  this; also covers a stale cookie after sign-out, AC-1.6.4).
- 403 `RSVP_CUTOFF_PASSED`: `now() >= matches.rsvp_cutoff_at` (AC-3.3.4) —
  returned by the Route Handler, but the real stop is the RLS policy on
  `rsvps` (Risk R3); the Handler's check only exists to give a clean error
  instead of a raw Postgres error.
- 404 `NOT_FOUND`: unknown fixture id.
- 400 `VALIDATION_ERROR`: answer not one of the three values.

### `PATCH /api/privacy`
- Request: `{ "photoConsent"?: boolean, "nationalityConsent"?: boolean, "statsConsent"?: boolean }`
- Requires a player session. Updates only the caller's own
  `player_consents` row (AC-4.3.2).
- 200: the resulting consent object.
- 401 `UNAUTHENTICATED`.
- 403 `FORBIDDEN_MINOR_CONSENT`: caller `is_minor` and `guardian_consent`
  is false — opt-in fields cannot be toggled on (AC-4.3.4). Toggling a
  field *off* is always allowed even without guardian consent.
- 400 `VALIDATION_ERROR`: unknown field / wrong type.

## Reads with no dedicated endpoint (Server Components)

- Home page: next match + countdown data, season record, latest published
  results, mini standings snapshot, squad teaser — one Server Component
  data-loading function per section, each reading the relevant public-safe
  view.
- `/squad`: `public_players` view, grouped by `position`.
- `/players/[id]`: `public_profile(id)` view; 404 if archived or missing.
- `/fixtures/[id]` initial render: same shape as the summary endpoint,
  fetched server-side for the first paint; the client then polls
  `GET /api/fixtures/[id]/summary` for live updates.
