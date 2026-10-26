# Session 05 — Privacy settings

## Goal

Build `/privacy` and `PATCH /api/privacy` per `docs/design/screens.md` and
`api.md`, including the minor/guardian-consent lock (`rules.md` §3,
`threats.md` T10).

## Scope (owned ACs)

AC-4.3.2 (api), AC-4.3.4 (end-to-end).

## Tasks

1. `/privacy` (redirects to `/sign-in` if signed out): three toggles
   (`privacy-toggle-photo`, `privacy-toggle-nationality`,
   `privacy-toggle-stats`), saving indicator, `privacy-saved` confirmation,
   `privacy-error` state.
2. Locked state: if the signed-in player `is_minor && !guardian_consent`,
   render the opt-in toggles disabled/locked
   (`privacy-toggle-photo-locked`, etc.) with an explanatory note.
3. `PATCH /api/privacy`: updates only the caller's own `player_consents`
   row; `403 FORBIDDEN_MINOR_CONSENT` when turning a field **on** for a
   minor without guardian consent (turning off is always allowed);
   `400 VALIDATION_ERROR` for unknown field/wrong type.
4. Confirm the change takes effect immediately on the public profile
   (`/players/[id]` from Session 04) with no stale cache (AC-4.3.2) —
   this is the one place two sessions' work must be checked together.

## Exit gate

- API-level test AC-4.3.2: toggle on, immediately re-fetch the public
  profile response, confirm the field now appears (and the reverse for
  toggling off).
- Playwright e2e AC-4.3.4: a seeded minor-without-guardian-consent player
  sees locked toggles in the UI, and a direct `PATCH` attempt to enable
  one still gets `403 FORBIDDEN_MINOR_CONSENT` from the server.
- `npm run build` exit 0; output shown in `PROGRESS.md`.

## Depends on

Session 01 (consent table/RLS), Session 02 (player session), Session 04
(public profile to verify the "takes effect immediately" check against).
