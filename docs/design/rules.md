# Shared rules

Logic every feature must call through — never reimplement locally. Each
rule has one source-of-truth implementation (a SQL function/policy and/or a
single TypeScript module under `lib/rules/`), used by both the UI (for
disabled states / messaging) and the API/DB (as the actual boundary).

## 1. RSVP cutoff

- **Source of truth**: Postgres — `now() < matches.rsvp_cutoff_at`,
  evaluated in UTC (`timestamptz` throughout, no naive timestamps — closes
  Risk R1). Enforced in the RLS policy on `rsvps` INSERT/UPDATE.
- **App-level mirror**: `lib/rules/cutoff.ts` exports `isRsvpOpen(match)`,
  used by: the countdown/"RSVP closed" label on the UI, and the Route
  Handler's pre-check (for a clean 403 instead of a raw DB error).
- Both the DB policy and the TS mirror must use the match row's
  `rsvp_cutoff_at` — never a client-supplied "current time."

## 2. Field visibility / consent

- `lib/rules/visibility.ts` exports `visiblePlayerFields(player, consents,
  viewerIsSelf)`:
  - `viewerIsSelf === true` → all fields except nothing (AC-4.3.3).
  - otherwise → `full_name`, `squad_number`, `position` always; `photo_url`
    only if `consents.photo_consent`; `nationality` only if
    `consents.nationality_consent`; stat lines only if
    `consents.stats_consent`; `dob`, `email`, `phone`, any RSVP answer:
    **never**, regardless of consent (AC-4.3.1 is a hard override, not a
    togglable field).
  - If `player.is_minor && !player.guardian_consent`: opt-in fields
    (photo/nationality/stats) are forced to hidden even if the consent
    flags are individually `true` (AC-4.2.2).
- This same function's logic is what the `public_profile` SQL view encodes
  — the view is the enforced version; the TS function exists so UI code
  (e.g. "why is this field hidden" messaging in privacy settings) matches
  the DB exactly, and so a unit test can check the rule without hitting a
  database.

## 3. Permission checks

- `canRsvp(viewerPlayer, match)` = viewer is a signed-in, non-archived
  player AND `isRsvpOpen(match)`.
- `canEditOwnConsent(viewerPlayer, field, newValue)` = always true for
  turning a field off; for turning a field on, true unless
  `viewerPlayer.is_minor && !viewerPlayer.guardian_consent` (AC-4.3.4).
- `isArchived(player)` filter: every query that lists or looks up a player
  must go through `public_players` / `public_profile`, which already apply
  `WHERE is_archived = false` — no feature re-implements this filter
  inline (closes the risk of the squad page and home teaser drifting
  apart, per the Dependencies section of `docs/REQUIREMENTS.md`).

## 4. Error format

All Route Handlers return the one shape defined in `api.md`
(`{ "error": { "code", "message" } }`) — no endpoint invents its own error
envelope.

## 5. Live-update cadence

Any screen with a "changes within 15 seconds" requirement polls its data
endpoint every 10 seconds while the tab is visible, and pauses when the
`document.visibilitychange` event reports hidden — one shared
`usePolling(url, intervalMs)` hook, not a bespoke `setInterval` per page.
