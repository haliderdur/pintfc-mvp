# Session 06 — RSVP and fixture page

## Goal

Build `/fixtures/[id]` (the event page / class-projector view) and its
two endpoints (`GET .../summary`, `POST .../rsvp`) per `api.md` and
`screens.md`. Session 01 already proved the DB-level cutoff/ownership
rules (AC-3.3.4, 3.3.6); this session wires the UI and polling on top.

## Scope (owned ACs)

AC-3.3.1, AC-3.3.2 (api), AC-3.3.5, AC-3.4.1, AC-3.4.3 (end-to-end except
3.3.2).

## Tasks

1. `GET /api/fixtures/[id]/summary`: public, returns counts always;
   `roster` populated only for a signed-in caller (`null` for visitors —
   D7/Q5 default). 404 for unknown fixture.
2. `POST /api/fixtures/[id]/rsvp`: requires player session; the RLS
   policy from Session 01 is the real stop, this Handler returns clean
   `403 RSVP_CUTOFF_PASSED` / `401 UNAUTHENTICATED` / `400
   VALIDATION_ERROR` instead of a raw DB error.
3. `/fixtures/[id]` page: signed-out shows counts only, no RSVP control,
   no roster (AC-3.3.5, AC-3.4.1); signed-in + RSVP open shows roster +
   RSVP control (`fixture-rsvp-going/maybe/not-going`); signed-in + RSVP
   closed shows `fixture-rsvp-closed` disabled state.
4. `usePolling(url, intervalMs)` shared hook (`rules.md` §5): 10s
   interval while `document.visibilitychange` reports visible, used here
   for the summary endpoint (AC-3.4.3) — write it once, reusable by any
   future live screen.
5. Resubmitting an RSVP replaces the previous answer (unique
   `(match_id, player_id)` constraint from Session 01 makes this an
   upsert, not an insert) — AC-3.3.2.

## Exit gate

- Playwright e2e: AC-3.3.1, AC-3.3.5, AC-3.4.1, AC-3.4.3 (two browser
  contexts: one changes RSVP, the other's open fixture page reflects it
  within 15s via the 10s poll).
- API-level test AC-3.3.2: same player POSTs two different answers,
  confirm exactly one `rsvps` row for that `(match, player)` with the
  latest answer.
- `npm run build` exit 0; output shown in `PROGRESS.md`.

## Depends on

Session 01 (rsvps table, RLS, `public_rsvp_counts` view), Session 02
(player session for the RSVP control and roster).
