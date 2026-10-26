# Test map

One row per in-scope acceptance check. "Level" is the check's **owning**
test (the one that must exist and pass for the check to count as covered —
`scripts/plan-check.mjs` in Phase 3 enforces exactly one owner per check).
A check may also be touched incidentally by other tests; that doesn't
change its owner here.

| AC id | Level | Test title |
|---|---|---|
| AC-1.1.1 | end-to-end | `AC-1.1.1 a seeded player can sign in with their fake credentials` |
| AC-1.1.3 | end-to-end | `AC-1.1.3 sign-in is rejected for wrong credentials with a generic error` |
| AC-1.1.4 | end-to-end | `AC-1.1.4 a signed-in player stays signed in across a reload` |
| AC-1.6.1 | end-to-end | `AC-1.6.1 sign out ends the session on this device` |
| AC-1.6.2 | end-to-end | `AC-1.6.2 sign out of all devices revokes every session` |
| AC-1.6.3 | end-to-end | `AC-1.6.3 signing out of all devices invalidates a second device's session` |
| AC-1.6.4 | api | `AC-1.6.4 a stale session cookie after sign-out grants no player privileges` |
| AC-2.1.1 | end-to-end | `AC-2.1.1 home page shows the next match's opponent, venue and local kickoff time` |
| AC-2.1.2 | end-to-end | `AC-2.1.2 the next-match countdown advances without a page reload` |
| AC-2.1.3 | end-to-end | `AC-2.1.3 a cancelled next match is labeled Cancelled instead of counting down` |
| AC-2.1.4 | end-to-end | `AC-2.1.4 home page shows an empty state when there is no upcoming match` |
| AC-2.1.5 | end-to-end | `AC-2.1.5 home page has no horizontal scroll at 320px width` |
| AC-2.1.6 | unit | `AC-2.1.6 the countdown shows a started/passed state instead of a negative value at zero` |
| AC-2.2.1 | unit | `AC-2.2.1 the season record is computed from published results only` |
| AC-2.2.2 | database | `AC-2.2.2 an unpublished result is excluded from record and latest-results reads` |
| AC-2.2.3 | end-to-end | `AC-2.2.3 latest results are listed most-recent-first with opponent, score and competition` |
| AC-2.2.4 | end-to-end | `AC-2.2.4 home page shows an empty state when there are no published results` |
| AC-2.3.1 | end-to-end | `AC-2.3.1 the mini league table shows the seeded standings snapshot` |
| AC-2.3.2 | end-to-end | `AC-2.3.2 PINT FC's row in the mini table is visually distinguished` |
| AC-2.4.1 | end-to-end | `AC-2.4.1 home page squad teaser shows active players and links to the full squad` |
| AC-2.4.2 | database | `AC-2.4.2 the archived player never appears in the squad teaser's underlying read` |
| AC-2.4.3 | end-to-end | `AC-2.4.3 the squad teaser's link opens the same squad page as /squad` |
| AC-3.3.1 | end-to-end | `AC-3.3.1 a signed-in player can RSVP Going, Maybe or Not going before the cutoff` |
| AC-3.3.2 | api | `AC-3.3.2 resubmitting an RSVP replaces the previous answer, not duplicates it` |
| AC-3.3.4 | database | `AC-3.3.4 an RSVP write is rejected by the database once the cutoff has passed` |
| AC-3.3.5 | end-to-end | `AC-3.3.5 a signed-out visitor cannot see or use the RSVP control` |
| AC-3.3.6 | database | `AC-3.3.6 a player's RSVP write is rejected for any player id other than their own` |
| AC-3.4.1 | end-to-end | `AC-3.4.1 the open fixture page shows RSVP counts without requiring sign-in` |
| AC-3.4.3 | end-to-end | `AC-3.4.3 fixture page counts update within 15 seconds of another player's RSVP change` |
| AC-4.1.1 | end-to-end | `AC-4.1.1 the squad page lists all active players grouped by position` |
| AC-4.1.2 | database | `AC-4.1.2 the archived player is excluded from the public players view` |
| AC-4.1.3 | end-to-end | `AC-4.1.3 clicking a squad entry opens that player's profile` |
| AC-4.2.1 | api | `AC-4.2.1 a profile response omits every field the player has not consented to show` |
| AC-4.2.2 | database | `AC-4.2.2 a minor player's opt-in fields are hidden when guardian consent is false, regardless of their own consent flags` |
| AC-4.3.1 | api | `AC-4.3.1 no public API response for any player ever contains email, phone, date of birth or RSVP answer` |
| AC-4.3.2 | api | `AC-4.3.2 toggling a consent field takes effect on the public profile immediately` |
| AC-4.3.3 | api | `AC-4.3.3 a player viewing their own profile sees all of their own fields regardless of consent toggles` |
| AC-4.3.4 | end-to-end | `AC-4.3.4 a minor without guardian consent sees opt-in privacy toggles locked, and the server rejects enabling them` |

## Count check

38 rows above, one per in-scope check (7 + 15 + 9 + 7, matching
`docs/REQUIREMENTS.md`). The authoritative count going forward is produced
by `scripts/plan-check.mjs` (Phase 3), which parses this table
programmatically and fails if any check has no owner or more than one.
