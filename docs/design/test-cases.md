# Test Cases — PINT FC MVP

Manual test cases derived from `docs/design/test-plan.md`. Each case
maps to one or more acceptance checks (`AC-x.y.z`) from
`docs/REQUIREMENTS.md`. Priority: **P1** = release blocker, **P2** =
should fix before next release, **P3** = minor/cosmetic.

Format: ID · Title · AC refs · Priority · Preconditions · Steps →
Expected result.

---

## A. Sign-in and sessions

### TC-AUTH-01 — Sign in with valid seeded credentials
**AC-1.1.1 · P1**
Preconditions: signed out; have a valid `pNN@pintfc.test` / shared
password from `seed-logins.md`.
1. Go to `/sign-in`.
2. Enter the email and password, submit.

Expected: redirected to a page reflecting signed-in state; header shows
the player's name, "Sign out," and "Sign out everywhere" instead of
"Sign in."

### TC-AUTH-02 — Sign in with wrong password
**AC-1.1.3 · P1**
1. Go to `/sign-in`.
2. Enter a valid seeded email with an incorrect password, submit.

Expected: a single generic error message (e.g. "incorrect email or
password") — not "wrong password" vs. "no such user." No session
created; header still shows "Sign in" after the attempt.

### TC-AUTH-03 — Sign in with an email that doesn't exist
**AC-1.1.3 · P1**
1. Go to `/sign-in`.
2. Enter an email not in the seed data, any password, submit.

Expected: the **same** generic error as TC-AUTH-02 — wording must not
differ in a way that reveals whether the account exists.

### TC-AUTH-04 — Session survives reload and new tab
**AC-1.1.4 · P1**
Preconditions: signed in (TC-AUTH-01).
1. Reload the current page.
2. Open the site in a new tab in the same browser.

Expected: still signed in on reload; the new tab also opens signed in,
no re-entry of credentials.

### TC-AUTH-05 — Sign out (this device only)
**AC-1.6.1 · P1**
Preconditions: signed in.
1. Click "Sign out."
2. Try to open `/privacy` directly.

Expected: header reverts to signed-out state; `/privacy` redirects to
`/sign-in` (protected action unavailable).

### TC-AUTH-06 — Sign out of all devices
**AC-1.6.2, AC-1.6.3 · P1**
Preconditions: same player signed in on two browser sessions (A and B).
1. On session A, click "Sign out everywhere."
2. On session B (without re-authenticating), reload or perform a
   protected action (e.g. open `/privacy`).

Expected: session A is signed out. Session B is also signed out after
its next authenticated request — redirected to sign-in / shown
signed-out state, not still treated as a valid player.

### TC-AUTH-07 — Stale cookie after sign-out grants nothing
**AC-1.6.4 · P1**
Preconditions: was signed in, then signed out (cookie may still exist
in some client caches/proxies — simulate by replaying an old cookie, or
rely on `tests/api/auth-stale-cookie.spec.ts` for the automated
version).
1. With a pre-sign-out cookie value, request the home page.

Expected: rendered markup is the signed-out header (no player name,
`header-signin` present, `header-signout` absent) — no privileges
granted from the stale cookie.

---

## B. Home page

### TC-HOME-01 — Next match shows opponent, venue, local kickoff time
**AC-2.1.1 · P1**
Preconditions: seed data present, at least one future scheduled match.
1. Open `/` as a visitor.

Expected: the next-match card (`home-next-match`) shows the opponent's
**name** (not blank), the venue **name** (not blank), and kickoff
date/time rendered in the browser's local time zone. *(Regression
guard: this exact case caught a real bug where opponent/venue names
rendered empty — verify the actual text, not just that the card isn't
empty.)*

### TC-HOME-02 — Countdown advances live
**AC-2.1.2 · P2**
1. Open `/` with a future next match.
2. Watch the countdown for 2–3 seconds without reloading.

Expected: the countdown value visibly decreases; no full page reload
occurs.

### TC-HOME-03 — Cancelled next match shows "Cancelled," not a countdown
**AC-2.1.3 · P1**
Preconditions: the only/next upcoming match is the seeded cancelled one.
1. Open `/`.

Expected: `home-next-match` renders with a "Cancelled" badge in place of
a live countdown; opponent/venue info for that match still shown.

### TC-HOME-04 — No upcoming match → empty state
**AC-2.1.4 · P1**
Preconditions: temporarily no scheduled/cancelled match in the future
(or use the forced test fixture).
1. Open `/`.

Expected: `home-next-match-empty` shown — not a blank or broken card.

### TC-HOME-05 — Countdown at zero doesn't go negative
**AC-2.1.6 · P2**
1. Open `/` with a match whose kickoff is imminent; wait past kickoff.

Expected: card updates to a "started/passed" state, never shows a
negative countdown (e.g. "-0d -1h").

### TC-HOME-06 — Season record counts published results only
**AC-2.2.1, AC-2.2.2 · P1**
1. Open `/`, note the W/D/L record (`home-record`).
2. Cross-check against the seeded published results only (4 published
   league results + 1 friendly, per seed data) — the 1 deliberately
   unpublished result must not be counted.

Expected: record matches published results only.

### TC-HOME-07 — Latest results list: correct order, opponent, score, competition
**AC-2.2.3 · P1**
1. Open `/`, inspect "Latest results" (`home-results-list`).

Expected: results are most-recent-first; each row shows the **opponent
name** (visible, correct per-match — not blank, not misattributed to
the wrong match), the score, and the competition type (league/friendly
— matching the actual seeded type per match, not defaulted). *(Same
class of regression as TC-HOME-01: a prior bug silently defaulted every
competition badge to "league.")*

### TC-HOME-08 — No published results → empty state
**AC-2.2.4 · P2**
Preconditions: temporarily no published results.
1. Open `/`.

Expected: `home-results-empty` shown.

### TC-HOME-09 — Mini league table shows seeded snapshot
**AC-2.3.1 · P2**
1. Open `/`, inspect "Mini league table" (`home-league-table`).

Expected: position, team, played, points match the seeded standings
snapshot exactly; no live recalculation.

### TC-HOME-10 — PINT FC's row is visually distinguished
**AC-2.3.2 · P2**
1. Open `/`, locate PINT FC's row in the mini table.

Expected: visually distinct (bold/highlighted background) from other
rows, at a glance, not just via DOM class name.

### TC-HOME-11 — Squad teaser shows active players, links to full squad
**AC-2.4.1, AC-2.4.2, AC-2.4.3 · P1**
1. Open `/`, inspect the squad teaser (`home-squad-teaser`).
2. Click "See full squad."

Expected: a handful of active players shown (never the archived
player); the link opens `/squad`, the same listing as TC-SQUAD-01 (not
a separate/duplicated list).

### TC-HOME-12 — Home page, visual regression check for card boundaries
**P2 (visual, not tied to a single AC — general UX)**
1. Open `/` in a normal browser window (not devtools-zoomed).

Expected: each section (Next match, Season record, Latest results,
Mini league table, Squad) is visually separated by a clearly visible
card border — not just whitespace. *(Regression guard: a prior build
used a near-invisible 10%-opacity ring that read as "no card at all" on
some displays.)*

### TC-HOME-13 — Latest results: score column stays aligned regardless of opponent name length
**P2 (visual, general UX)**
1. Open `/`, compare the horizontal position of each score (e.g. "1-1,"
   "3-2") across rows with opponent names of different lengths.

Expected: all scores line up in the same column; a long opponent name
truncates (ellipsis) rather than pushing the score out of alignment.

### TC-HOME-14 — No horizontal scroll at 320px
**AC-2.1.5, AC-5.4 · P1**
1. Resize the viewport (or device emulate) to 320px wide.
2. Open `/`.

Expected: no horizontal scrollbar; `document.documentElement.scrollWidth`
does not exceed 320px.

### TC-HOME-15 — Data fetch failure shows generic error
**P2**
1. Simulate a data-fetch failure (e.g. via a forced error boundary / dev
   tooling).

Expected: `home-error` generic retry message shown, not a stack trace or
blank page.

---

## C. Squad and profiles

### TC-SQUAD-01 — All active players listed, grouped by position
**AC-4.1.1 · P1**
1. Open `/squad` as a visitor.

Expected: all 40 seeded active players listed, grouped by position
(GK/DEF/MID/FWD); the archived player is never present.

### TC-SQUAD-02 — Archived player never appears
**AC-4.1.2 · P1**
1. Open `/squad`; search the DOM/visible list for the seeded archived
   player's name.

Expected: not present, in any grouping, count, or search result.

### TC-SQUAD-03 — Clicking a squad entry opens that player's profile
**AC-4.1.3 · P1**
1. On `/squad`, click any active player.

Expected: navigates to `/players/[id]` for that exact player.

### TC-PROFILE-01 — Profile shows only consented fields (visitor view)
**AC-4.2.1 · P1**
Preconditions: know a seeded player with photo consent ON, nationality
OFF, stats ON (or similar mixed state).
1. As a signed-out visitor, open that player's profile.

Expected: photo and stats fields rendered; nationality field (and its
`data-testid`) absent entirely from the DOM — not merely hidden by CSS.
Verify via "View Source" / network response, not just visual absence.

### TC-PROFILE-02 — Minor without guardian consent shows baseline only
**AC-4.2.2 · P1**
Preconditions: seeded minor player without guardian consent, with their
own consent toggles individually set to true (seed data models this).
1. As a visitor, open that player's profile.

Expected: only name, squad number, position shown. No photo,
nationality, or stats — even though that player's own consent flags
are on. Guardian consent overrides individual toggles.

### TC-PROFILE-03 — Archived/unknown player id → real 404
**P2**
1. Visit `/players/[archived-player-id]` and `/players/not-a-real-id`.

Expected: both return a genuine 404 page, not a broken/blank render.

### TC-PRIVACY-01 — PII never appears in any public response
**AC-4.3.1 · P1 — hard release blocker**
1. For a sample of players (ideally all 40), fetch their public profile
   page and/or API response as a signed-out visitor and as a different
   signed-in player.
2. Search the raw response for email, phone, date of birth, and RSVP
   answer fields.

Expected: none of those four fields appear anywhere, for any player,
under any viewer identity other than the player themself.

### TC-PRIVACY-02 — Toggling consent takes effect immediately
**AC-4.3.2 · P1**
Preconditions: signed in as a non-minor (or consented minor) player.
1. Go to `/privacy`, toggle photo consent off.
2. In another tab/session, view that player's public profile.

Expected: the photo field is gone from the public profile immediately —
no stale cache showing the old consent state.

### TC-PRIVACY-03 — Viewing your own profile shows everything
**AC-4.3.3 · P1**
Preconditions: signed in; own consent toggles mixed (some on, some
off).
1. View your own profile as yourself.

Expected: all of your own fields are visible regardless of your consent
toggles — consent only governs what *others* see.

### TC-PRIVACY-04 — Minor without guardian consent sees locked toggles
**AC-4.3.4 · P1**
Preconditions: signed in as the seeded minor without guardian consent.
1. Open `/privacy`.
2. Attempt to toggle an opt-in field on via the UI.
3. Attempt the same via a direct `PATCH /api/privacy` call (e.g. via
   devtools/curl) bypassing the UI.

Expected: UI shows the toggle visibly locked/disabled with an
explanation — not a toggle that looks enabled but silently no-ops. The
direct API call is also rejected (403 / `FORBIDDEN_MINOR_CONSENT`), not
just blocked client-side.

---

## D. Going / Not going (RSVP)

### TC-RSVP-01 — Signed-in player can RSVP before cutoff
**AC-3.3.1 · P1**
Preconditions: re-seed if needed (Risk T1) so the demo match's cutoff
hasn't passed; signed in.
1. Open `/fixtures/[id]` for the open match.
2. Choose "Going."

Expected: exactly one of Going/Maybe/Not going selectable; selection is
saved and reflected in the roster/count immediately.

### TC-RSVP-02 — Changing an answer replaces, not duplicates
**AC-3.3.2 · P1**
Preconditions: as TC-RSVP-01, already answered once.
1. Submit a different answer (e.g. "Maybe" after "Going").

Expected: roster/count shows only the latest answer for that player —
no duplicate entries, count totals sum correctly.

### TC-RSVP-03 — Visitor cannot see or use RSVP control
**AC-3.3.5 · P1**
1. As a signed-out visitor, open `/fixtures/[id]`.

Expected: no RSVP buttons rendered; no per-player roster shown. Counts
only.

### TC-RSVP-04 — RSVP closed after cutoff (UI)
**AC-3.3.4 · P1**
Preconditions: a match whose `rsvp_cutoff_at` has passed (re-seed and
wait, or use a match naturally past cutoff).
1. Signed in, open that match's fixture page.

Expected: RSVP control is disabled/read-only, clearly labeled "RSVP
closed" (`fixture-rsvp-closed`) — not just grayed out with no label.

### TC-RSVP-05 — RSVP closed after cutoff (direct API bypass)
**AC-3.3.4 · P1 — security-relevant**
Preconditions: as TC-RSVP-04.
1. With a valid signed-in session, call `POST
   /api/fixtures/[id]/rsvp` directly (devtools/curl), bypassing the
   disabled UI control.

Expected: request rejected (403/error), not silently accepted — the
cutoff is enforced server-side (API and/or DB RLS), never trusted from
the client.

### TC-RSVP-06 — Cannot RSVP on behalf of another player
**AC-3.3.6 · P1 — security-relevant**
Preconditions: signed in as Player A.
1. Call `POST /api/fixtures/[id]/rsvp` with Player B's `player_id` in
   the payload instead of your own.

Expected: rejected — a player can only ever write their own RSVP row,
regardless of what `player_id` is supplied in the request.

### TC-RSVP-07 — Open fixture page shows counts without sign-in
**AC-3.4.1 · P1**
1. As a visitor, open `/fixtures/[id]`.

Expected: Going/Maybe/Not going counts (`fixture-count-going`, etc.)
visible without signing in.

### TC-RSVP-08 — Counts update live within 15 seconds
**AC-3.4.3 · P2**
Preconditions: two sessions — Session A viewing `/fixtures/[id]`,
Session B signed in as a different player.
1. On Session B, submit/change an RSVP for that match.
2. On Session A, without manually reloading, wait up to 15 seconds.

Expected: Session A's counts (and roster, if signed in) update to
reflect Session B's change without a manual reload.

---

## E. Cross-cutting: accessibility and layout

### TC-A11Y-01 — WCAG AA contrast on every release screen
**AC-5.2 · P1**
1. Run an automated contrast check (axe, `color-contrast` rule) or
   visually inspect with a contrast checker against: `/`, `/squad`,
   `/players/[id]`, `/fixtures/[id]`, `/sign-in`, `/privacy`.

Expected: zero contrast violations on every screen, in particular
interactive elements (buttons, links) against their background.
*(Regression guard: a prior build had the primary "Sign in" button
failing AA due to an unlayered CSS reset silently overriding the
intended text color — verify the actual rendered color, not just that
the element "looks dark enough.")*

### TC-A11Y-02 — No horizontal scroll at 320px on every release screen
**AC-5.4 · P1**
1. At 320px viewport width, visit: `/`, `/squad`, `/players/[id]`,
   `/fixtures/[id]`, `/sign-in`, `/privacy`.

Expected: no horizontal scrollbar on any of the six screens.

### TC-A11Y-03 — Keyboard navigation through primary flows
**P2 (not a numbered AC, general accessibility hygiene)**
1. Using only the keyboard (Tab/Enter/Space), sign in, navigate to
   squad, open a profile, open a fixture, and (if applicable) submit an
   RSVP.

Expected: every interactive element is reachable and operable via
keyboard, with a visible focus indicator at each step.

---

## F. Cross-browser / cross-device spot checks

### TC-DEVICE-01 — Mobile viewport rendering (≈390px, e.g. iPhone-class)
**P2**
1. Load `/` and `/squad` at a ~390px viewport.

Expected: layout matches desktop content (no missing sections), text
legible, no overlapping elements.

### TC-DEVICE-02 — High-contrast / forced-colors mode
**P3**
1. Enable OS/browser forced-colors (high-contrast) mode.
2. Load `/`.

Expected: all text and interactive elements remain legible and usable;
no content disappears.

### TC-DEVICE-03 — Dark-mode OS preference
**P3**
1. Set the OS/browser color-scheme preference to dark.
2. Load `/`.

Expected: page renders consistently (this app is explicitly light-theme
only per `docs/REQUIREMENTS.md` — verify it does **not** partially apply
dark styling in a way that breaks contrast or legibility).

---

## Traceability summary

| AC id | Covered by |
|---|---|
| AC-1.1.1 | TC-AUTH-01 |
| AC-1.1.3 | TC-AUTH-02, TC-AUTH-03 |
| AC-1.1.4 | TC-AUTH-04 |
| AC-1.6.1 | TC-AUTH-05 |
| AC-1.6.2 | TC-AUTH-06 |
| AC-1.6.3 | TC-AUTH-06 |
| AC-1.6.4 | TC-AUTH-07 |
| AC-2.1.1 | TC-HOME-01 |
| AC-2.1.2 | TC-HOME-02 |
| AC-2.1.3 | TC-HOME-03 |
| AC-2.1.4 | TC-HOME-04 |
| AC-2.1.5 | TC-HOME-14 |
| AC-2.1.6 | TC-HOME-05 |
| AC-2.2.1 | TC-HOME-06 |
| AC-2.2.2 | TC-HOME-06 |
| AC-2.2.3 | TC-HOME-07 |
| AC-2.2.4 | TC-HOME-08 |
| AC-2.3.1 | TC-HOME-09 |
| AC-2.3.2 | TC-HOME-10 |
| AC-2.4.1 | TC-HOME-11 |
| AC-2.4.2 | TC-HOME-11 |
| AC-2.4.3 | TC-HOME-11 |
| AC-3.3.1 | TC-RSVP-01 |
| AC-3.3.2 | TC-RSVP-02 |
| AC-3.3.4 | TC-RSVP-04, TC-RSVP-05 |
| AC-3.3.5 | TC-RSVP-03 |
| AC-3.3.6 | TC-RSVP-06 |
| AC-3.4.1 | TC-RSVP-07 |
| AC-3.4.3 | TC-RSVP-08 |
| AC-4.1.1 | TC-SQUAD-01 |
| AC-4.1.2 | TC-SQUAD-02 |
| AC-4.1.3 | TC-SQUAD-03 |
| AC-4.2.1 | TC-PROFILE-01 |
| AC-4.2.2 | TC-PROFILE-02 |
| AC-4.3.1 | TC-PRIVACY-01 |
| AC-4.3.2 | TC-PRIVACY-02 |
| AC-4.3.3 | TC-PRIVACY-03 |
| AC-4.3.4 | TC-PRIVACY-04 |
| AC-5.2 | TC-A11Y-01 |
| AC-5.4 | TC-A11Y-02 |

38/38 acceptance checks covered by at least one manual test case above,
matching `docs/design/test-map.md`'s automated coverage. Cases without
an AC id (TC-HOME-12/13/15, TC-A11Y-03, TC-DEVICE-01/02/03) are
additional UX/robustness checks not tied to a numbered requirement.
