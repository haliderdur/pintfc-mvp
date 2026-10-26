# Session 04 — Squad and profiles

## Goal

Build `/squad` and `/players/[id]` per `docs/design/screens.md`, enforcing
the field-visibility rule (`rules.md` §2) end-to-end through the API/page,
not just in the UI (closing the AC-4.3.1 invariant at this layer).

## Scope (owned ACs)

AC-4.1.1, AC-4.1.3, AC-4.2.1, AC-4.3.1, AC-4.3.3
(4.2.1/4.3.1/4.3.3 are `api`-level per `test-map.md`; 4.1.1/4.1.3 are
`end-to-end`).

## Tasks

1. `/squad`: list all active players from `public_players`, grouped by
   position (GK/DEF/MID/FWD); each entry links to `squad-player-{id}`.
   Archived-player exclusion already enforced by the view (Session 01,
   AC-4.1.2) — this session just renders the view's rows as-is.
2. `/players/[id]`: reads `public_profile(id)`; 404 for archived or
   unknown id. Renders only consent-visible fields
   (`profile-field-photo`, `profile-field-nationality`,
   `profile-field-stats`), always `profile-name`/`profile-number`/
   `profile-position`.
3. Self-view: when the viewer is signed in (Session 02) and
   `viewerIsSelf`, render all of their own fields regardless of consent
   (AC-4.3.3) — route through `lib/rules/visibility.ts` so self-view and
   public-view share one function, not two code paths.
4. Response-level check: write the AC-4.3.1 invariant test directly
   against whatever the page/API actually returns (not just what renders
   visually) for every player, confirming `email`/`phone`/`dob`/any RSVP
   field is absent from the payload.

## Exit gate

- Playwright e2e: AC-4.1.1, AC-4.1.3.
- API-level tests (fetch the page's/Route's JSON data, not just DOM):
  AC-4.2.1, AC-4.3.1 (run across all 40 seeded players, not a sample),
  AC-4.3.3 (one seeded player viewing their own profile while signed in).
- `npm run build` exit 0; output shown in `PROGRESS.md`.

## Depends on

Session 01 (views, visibility rule), Session 02 (self-view needs a
session to know who "self" is).
