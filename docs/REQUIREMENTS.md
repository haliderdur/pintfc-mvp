# PINT FC MVP — Requirements

Source: `docs/requirements/PINTFC-MVP-Requirements.pdf` ("PINT FC MVP: club
website + Going / Not going (38 checks)", docs/MVP.md at commit `47b5ac1`,
chosen by the owner Oct 22, 2026, option 2).

The PDF names acceptance-check **IDs** (AC-x.y.z) and groups them by area and
count, but does not spell out each check's wording — it references a longer
spec v0.3 that is not present in this repo. Every check below is therefore
**written by us from the PDF's context** (the FR numbers, the "what it is" /
"who uses it" / "my calls" / "out of scope" / "seed data" / "done means"
sections) and is marked **(derived)**. If the real spec v0.3 ever shows up,
re-check these against it before trusting the wording.

Per the brief: ignore the PDF's deployment target (`cydeo-learners/pintfc`
Vercel team, `pintfc` Supabase project, "the owner" = instructor). We deploy
to the actual accounts found in Phase 0 — Vercel team `halid-s-team`,
Supabase project `dgrjyksawdongzxpkjey` ("Halid's Project") — and design our
own screens. "The owner" throughout means the product owner of this repo.

## Users and what each can do

| Who | Can do |
|---|---|
| **Visitor (fan)** | Home page, squad, player profiles — consented fields only. No sign-in required. |
| **Player** (fake login, one per seeded player) | Sign in / sign out (including sign out of all devices); set own privacy settings; RSVP (Going / Maybe / Not going) for the next match before the cutoff; see teammates' RSVP answers, without seeing their reasons (there are no "reasons" field in this MVP — read as: without seeing anything beyond the three-state answer). |
| **Admin** | **No screens in the MVP.** All season data comes from a seed script, fake data only. Not a sign-in role for this build. |

## In scope

Area → FR → AC IDs (38 total, confirmed by count):

| Area | FRs | AC IDs | Count |
|---|---|---|---|
| Sign-in and sessions | FR-1.1 (players), FR-1.6 | AC-1.1.1, 1.1.3, 1.1.4, 1.6.1, 1.6.2, 1.6.3, 1.6.4 | 7 |
| Home page | FR-2.1, FR-2.2, FR-2.3, FR-2.4 | AC-2.1.1–2.1.6, 2.2.1–2.2.4, 2.3.1–2.3.2, 2.4.1–2.4.3 | 15 |
| Squad and profiles | FR-4.1, FR-4.2, FR-4.3 | AC-4.1.1–4.1.3, 4.2.1–4.2.2, 4.3.1–4.3.4 | 9 |
| Going / Not going | FR-3.3, FR-3.4 | AC-3.3.1, 3.3.2, 3.3.4, 3.3.5, 3.3.6, 3.4.1, 3.4.3 | 7 |
| Footer and social | FR-10.1 (content only: crest, name, location, quick links, social icons) | none — its checks cover the newsletter, which is out | 0 |

**Total: 38.**

Owner's standing calls, carried forward as requirements:

- **Event page**: a minimal page at `/fixtures/[id]` showing the attendance
  list and RSVP counts. Required by AC-3.4.1; it also serves as the class
  projector view.
- **Look**: "Sport" (look B), light theme only, per `docs/design/06-screens.md`
  (to be written in Phase 2). No theme toggle in the MVP (AC-5.1 is out).
- **Design gates kept**: contrast (AC-5.2) and no horizontal scroll at 320px
  (AC-5.4) — both are release gates, not optional, because students use
  phones.
- **Live count**: the RSVP/event page polls the API every 10 seconds while
  visible. Signed-in users must see the count change within 15 seconds of a
  change (the 10s poll plus network/render time satisfies this with margin).

## Out of scope

- **Admin**: admin console (FR-9.x), invites (FR-1.2), password reset
  (FR-1.3), admin MFA (FR-1.4, FR-1.8, AC-1.1.2), Google/Apple sign-in
  (FR-1.5).
- **Lockout / rate limiting** (FR-1.7) — accepted risk while all data is fake.
- **Schedule**: schedule page and calendar feeds (FR-3.1, FR-3.5), full event
  detail (FR-3.2), waitlists (FR-3.6).
- **Changes after the fact**: moving a kickoff (AC-3.3.3), admin overrides of
  RSVPs (AC-3.4.2).
- **Stats and standings**: leaderboards page (FR-5.1), full league table page,
  standings sync, manual standings (FR-5.2–5.4). The MVP's mini table reads a
  static seeded snapshot only.
- **Everything else**: MOTM (4.6), store (4.7), news/notifications/email/
  reminders (4.8), newsletter (AC-10.1.x), deletion requests (AC-4.3.5),
  featured blocks (FR-2.5), Instagram (FR-10.2), reduced motion (AC-5.3), PWA.

## Acceptance checks (Given / When / Then)

All checks below are **(derived)** from the PDF, keeping its ID.

### Sign-in and sessions (FR-1.1, FR-1.6) — 7 checks

- **AC-1.1.1** (derived) — Given a seeded player's fake credentials, When they
  submit the sign-in form, Then they are signed in and land on a page that
  reflects signed-in state (e.g. their name/avatar in the header).
- **AC-1.1.3** (derived) — Given wrong credentials for a seeded player, When
  they submit the sign-in form, Then sign-in is rejected with a generic error
  (no "no such user" vs "wrong password" distinction) and no session is
  created.
- **AC-1.1.4** (derived) — Given a signed-in player, When they reload the page
  or return in a new tab within the session lifetime, Then they remain signed
  in without re-entering credentials.
- **AC-1.6.1** (derived) — Given a signed-in player, When they choose "sign
  out", Then their session on this device ends and protected actions (RSVP,
  privacy settings) become unavailable until they sign in again.
- **AC-1.6.2** (derived) — Given a signed-in player, When they choose "sign
  out of all devices", Then every session for that player (this device and
  any others) is invalidated.
- **AC-1.6.3** (derived) — Given a player signed in on two devices/browsers,
  When they sign out of all devices from one of them, Then the other device's
  next authenticated request fails and that device is treated as signed out.
- **AC-1.6.4** (derived) — Given a player has signed out (either kind), When
  they open the app again, Then no stale session cookie grants player
  privileges (visitor view only).

### Home page (FR-2.1–FR-2.4) — 15 checks

- **AC-2.1.1** (derived) — Given there is a published upcoming match, When a
  visitor opens the home page, Then the next match card shows opponent,
  venue, and kickoff date/time in the visitor's local time zone.
- **AC-2.1.2** (derived) — Given the next match has a kickoff in the future,
  When the home page is open, Then a countdown to kickoff is shown and
  advances without a full page reload.
- **AC-2.1.3** (derived) — Given the seeded "upcoming matches" include one
  cancelled match, When that match would otherwise be "next", Then it is
  skipped and the next non-cancelled upcoming match is shown (or the
  cancelled state is explicitly labeled if it's the only one — see Q4).
- **AC-2.1.4** (derived) — Given there is no upcoming match at all, When a
  visitor opens the home page, Then an explicit "no upcoming match" empty
  state is shown (not a broken or blank card).
- **AC-2.1.5** (derived) — Given the next match data, When the home page
  renders, Then it renders correctly at 320px width with no horizontal
  scroll (ties to AC-5.4).
- **AC-2.1.6** (derived) — Given the countdown reaches zero while the page is
  open, When kickoff time passes, Then the card updates to reflect the match
  has started/passed rather than showing a negative countdown.
- **AC-2.2.1** (derived) — Given seeded past league matches with published
  results, When the home page loads the season record, Then it shows
  win/draw/loss counts computed only from published results.
- **AC-2.2.2** (derived) — Given one seeded result is saved but not
  published, When the season record and latest results are computed, Then
  that result is excluded entirely (not counted, not listed).
- **AC-2.2.3** (derived) — Given published past results, When the home page
  loads "latest results", Then it lists them most-recent-first with
  opponent, score, and competition (league vs. friendly).
- **AC-2.2.4** (derived) — Given no published results exist yet, When the
  home page loads, Then the latest-results section shows an explicit empty
  state.
- **AC-2.3.1** (derived) — Given the seeded league table snapshot, When the
  home page loads the mini league table, Then it shows the seeded standings
  (position, team, played, points at minimum) without calling any
  standings-sync logic (that's out of scope).
- **AC-2.3.2** (derived) — Given the seeded snapshot, When the mini table
  renders, Then PINT FC's own row is visually distinguishable (e.g.
  highlighted) from opponents.
- **AC-2.4.1** (derived) — Given the active (non-archived) squad, When the
  home page loads its squad teaser, Then it shows a subset of active players
  with a link to the full squad page.
- **AC-2.4.2** (derived) — Given the archived player in the seed data, When
  the home page squad teaser renders, Then the archived player never appears.
- **AC-2.4.3** (derived) — Given a visitor clicks the squad teaser's "see
  full squad" link, When the squad page loads, Then it is the same squad
  listing covered by AC-4.1.x (one source of truth, not a duplicate list).

### Going / Not going (FR-3.3, FR-3.4) — 7 checks

- **AC-3.3.1** (derived) — Given a signed-in player and an upcoming match
  before its RSVP cutoff, When they open the RSVP control, Then they can
  choose exactly one of Going / Maybe / Not going.
- **AC-3.3.2** (derived) — Given a signed-in player has already answered,
  When they open the RSVP control again before the cutoff, Then they can
  change their answer and the previous answer is replaced (not duplicated).
- **AC-3.3.4** (derived) — Given the match's RSVP cutoff has passed, When a
  signed-in player opens the RSVP control, Then it is disabled/read-only and
  clearly labeled "RSVP closed", with no write accepted even if attempted
  directly against the API (see also Q2 / Risk R3).
- **AC-3.3.5** (derived) — Given a visitor (not signed in), When they view a
  match, Then they cannot see or use the RSVP control (sign-in required,
  per the "who uses it" table).
- **AC-3.3.6** (derived) — Given a signed-in player submits an RSVP, When the
  write succeeds, Then it is attributed to that player only (a player cannot
  RSVP on behalf of a teammate).
- **AC-3.4.1** (derived) — Given any match (does not require sign-in, per
  "open event page"), When a user opens `/fixtures/[id]`, Then they see the
  per-answer counts (Going/Maybe/Not going) and, if signed in, the list of
  who answered what — without reasons/comments, since none exist in this
  MVP.
- **AC-3.4.3** (derived) — Given another player changes their RSVP, When a
  user has `/fixtures/[id]` open, Then the displayed counts update within 15
  seconds (satisfied by the 10-second poll).

### Squad and profiles (FR-4.1, FR-4.2, FR-4.3) — 9 checks

- **AC-4.1.1** (derived) — Given the 40 active seeded players, When any user
  (visitor or player) opens the squad page, Then all active players are
  listed, grouped or filterable by position (GK/DEF/MID/FWD).
- **AC-4.1.2** (derived) — Given the one archived player in the seed data,
  When the squad page renders, Then the archived player never appears in the
  list, search, or any count ("must never appear" per the PDF).
- **AC-4.1.3** (derived) — Given the squad list, When a user clicks a player,
  Then they navigate to that player's profile page (AC-4.2.x).
- **AC-4.2.1** (derived) — Given a player's per-field consent settings
  (photo / nationality / stats), When a visitor or another player views
  their profile, Then only the fields that player has consented to show are
  rendered; everything else is omitted from both the page and its underlying
  API response (not just hidden in the UI).
- **AC-4.2.2** (derived) — Given the two seeded under-18 players (one with
  guardian consent and opt-in, one without), When their profiles are viewed,
  Then the one without guardian consent shows the minimum non-consentable
  baseline only (e.g. name, squad number, position) and none of the
  opt-in fields, regardless of that player's own in-app consent toggles.
- **AC-4.3.1** (derived; stated as an explicit invariant in "Done means") —
  Given any public (non-owner, i.e. not the player themself) API response or
  rendered page, When it includes a player, Then it never contains that
  player's email, phone number, date of birth, or RSVP answer. This is a
  hard invariant checked across every endpoint, not just the profile page.
- **AC-4.3.2** (derived) — Given a signed-in player on their own privacy
  settings, When they toggle consent for photo / nationality / stats, Then
  the change is saved and takes effect on their public profile immediately
  (no caching that shows stale consent).
- **AC-4.3.3** (derived) — Given a signed-in player, When they view their own
  profile (as themself, not as the public), Then they see all of their own
  fields regardless of consent toggles (consent governs what *others* see,
  not what they see of themselves).
- **AC-4.3.4** (derived) — Given a signed-in under-18 player without guardian
  consent, When they open privacy settings, Then opt-in fields that require
  guardian consent are shown as locked/unavailable, not silently droppable
  toggles that look enabled.

## Cross-cutting rules

- **Privacy enforcement (AC-4.3.1 invariant)**: must hold at every layer that
  can produce a public response — the page, the API route, and the database
  row level — not just hidden with CSS. See `docs/design/rules.md` and
  `docs/design/threats.md` in Phase 2 for the actual mechanism (expected:
  Postgres RLS as the last line of defense, API-level field allow-listing as
  the main one).
- **RSVP cutoff**: a per-match timestamp. "Before the cutoff" must be
  evaluated server-side (API/DB), never trusted from the client, because the
  countdown and "RSVP closed" label are UI only.
- **"Updates within 15 seconds"**: satisfied by polling every 10s while the
  relevant page is visible (per the PDF's "spec's default"). Applies to the
  home page's live bits and the event page's counts.
- **Seed data, fake only**: one current season (one league + one friendly
  competition), opponents with placeholder crests and venues, 40 active fake
  players (incl. 2 U18s — one consented, one not — and mixed photo/
  nationality/stats consent), 1 archived player (must never appear), past
  league results (published) + 1 friendly + 1 unpublished result, upcoming
  matches (1 cancelled) + weekly trainings, 1 league table snapshot, and a
  "class demo match" whose RSVP cutoff falls during the class session so
  "RSVP closed" happens live (depends on actual class date/time — Q1).

## Dependencies between requirements

1. **Seed script → everything.** No feature has real data to show without
   the seed script running first (season, players, matches, results,
   standings snapshot). Session 01/02 of the build must seed before any UI
   work is testable end-to-end.
2. **Sign-in (FR-1.1/1.6) → RSVP (FR-3.3) and privacy settings (FR-4.3).**
   Both require a player session; privacy settings also require knowing
   which player is "self" vs. "other" to decide self-view vs. consent-gated
   view (AC-4.3.3 vs. AC-4.2.1).
2. **Privacy/consent model (FR-4.3) → profile rendering (FR-4.2) and the
   privacy invariant (AC-4.3.1).** The consent schema must exist before
   profile pages or the squad list can correctly filter fields, and before
   any API response can be tested against the invariant.
3. **Match + RSVP cutoff model → home page countdown (FR-2.1), RSVP controls
   (FR-3.3), and event page (FR-3.4).** All three read the same "next match"
   and "cutoff" concepts; the cutoff rule (server-side, timezone-safe,
   `rules.md`) must be built once and reused, not duplicated.
3. **Published vs. unpublished results → season record and latest results
   (FR-2.2).** The "published" flag must exist on results before the record/
   latest-results logic can be written or tested, since one seeded result is
   deliberately unpublished.
4. **Archived-player flag → squad (FR-4.1) and home squad teaser (FR-2.4).**
   Both must filter it out; it should be one shared query/view, not two
   separate filters that could drift.
5. **Event page (FR-3.4) depends on RSVP (FR-3.3) existing** — it displays
   RSVP state/counts, so the RSVP write path must exist (even against seed
   data) before the event page's live-count behavior can be tested.

## Risks and gaps

- **R1 — Time zones and DST.** Kickoff times, the RSVP cutoff, and the class
  demo match all depend on correct timezone handling. The seed data and the
  "class demo match" cutoff are presumably authored in one timezone (likely
  the class's local zone); if match timestamps are stored naively (no TZ) or
  compared in server-local time instead of a fixed zone (e.g. UTC in the DB,
  converted for display), the cutoff could fire at the wrong wall-clock time
  around a DST transition. **Mitigation to design in Phase 2**: store all
  timestamps as `timestamptz` in UTC, do cutoff comparisons in UTC
  server-side, and only convert to local time for display.
- **R2 — Where privacy is enforced.** If consent filtering only happens in a
  React component or a Next.js page, a visitor can still read everything by
  calling the Supabase REST/GraphQL API directly with the anon key (which is
  public in any Next.js client bundle). **This must be closed with Postgres
  Row Level Security and/or column-level grants on the base tables**, with
  API-level filtering as a second layer, not the only one. To cover in
  `docs/design/threats.md` and `data.md`'s access matrix.
- **R3 — Authenticated player calling the database/API directly.** A signed-
  in player has a real Supabase session (JWT), so they could bypass the UI
  entirely and call the API/DB directly to: RSVP after the cutoff, RSVP as
  another player, read other players' email/phone/DOB, or read other
  players' RSVP answers (which are meant to be visible as counts/who-said-
  what but explicitly not "reasons" — and per AC-4.3.1, never certain
  fields at all). Every one of these must be blocked by RLS policies and/or
  API-side authorization checks that re-validate `auth.uid()`, not just by
  the UI disabling a button.
- **R4 — Sign-in cookies on Vercel preview URLs.** Supabase Auth typically
  sets cookies scoped to the deployment's own domain. Vercel preview
  deployments get a new URL per deployment (and per PR, if using Git
  integration), which can break "stays signed in" expectations across
  preview redeploys, and complicates AC-1.1.4/1.6.x testing with Playwright
  against preview URLs. Also: Supabase's "Site URL" / redirect allow-list
  needs each preview pattern added, or OAuth-style/magic-link flows will
  fail on preview (less relevant here since sign-in is a seeded fake-login
  form, but still affects cookie `Secure`/`SameSite` behavior over preview
  HTTPS). To resolve in `docs/design/architecture.md`.
- **R5 — Supabase plan limits.** The CLI did not expose the project's billing
  tier directly; assume **Free tier** until confirmed (Q3). Free tier
  implications to watch: project auto-pauses after 1 week of inactivity
  (would break a demo if the project hasn't been hit recently), and
  row/connection limits are generous enough for 40 seeded players but worth
  stating as an assumption.
- **R6 — Vercel plan limits.** Team `halid-s-team` is confirmed **Hobby**
  plan. Hobby plan implications: Hobby projects are intended for personal,
  non-commercial use (fine here), have serverless function duration/region
  limits, and **do not get a password-protection/preview-protection-free
  option for custom domains the same way Pro does** — if the owner wants
  preview deployments visible to students without a Vercel login, confirm
  Deployment Protection is off for previews (default on Hobby can still
  require Vercel auth for preview URLs depending on settings).
- **R7 — "Teammates' answers, without their reasons."** The MVP has no
  "reason" field anywhere in scope (no FR defines one). Read literally this
  clause may just be guarding against a *future* reasons field leaking; for
  this MVP it has no effect beyond "don't display more than Going/Maybe/Not
  going per teammate." Flagged in case the real spec v0.3 defines a reasons
  field we're missing.
- **R8 — AC-2.1.3 cancelled-match display** is genuinely ambiguous from the
  PDF (see Q4 below) — written as "derived" with a guess; needs the owner's
  call before Session covering the home page is planned in detail.

## Questions for the owner (each with a proposed default)

1. **Q1 — Class demo date/time.** The seed data needs the next match's RSVP
   cutoff to fall during an actual class session so "RSVP closed" happens
   live. What is the date and time of that class?
   **Proposed default**: if not provided before Session 01's seed script is
   written, seed the cutoff as "2 hours from whenever the seed script runs,"
   so any demo run within that window shows the live transition, and revisit
   once a real date is given.
2. **Q2 — RSVP cutoff lead time.** How long before kickoff does the RSVP
   cutoff fall (e.g. 24h, 2h, "midnight the day before")?
   **Proposed default**: 2 hours before kickoff, matching a typical five-a-
   side/park-football RSVP window — easy to change later since it's one
   config value per match.
3. **Q3 — Supabase plan tier.** The CLI's `projects list` didn't return a
   plan/tier field. Can you confirm (Supabase dashboard → project settings →
   billing) whether `dgrjyksawdongzxpkjey` is Free or a paid tier?
   **Proposed default**: assume Free tier; if wrong, the main consequence is
   more headroom, not less — safe to proceed and correct later.
4. **Q4 — Cancelled upcoming match display.** If the *only* upcoming match
   is the seeded cancelled one, should the home page (a) skip it and show
   the "no upcoming match" empty state, or (b) show it labeled "Cancelled"
   instead of a countdown?
   **Proposed default**: (b) show it labeled "Cancelled" — a visitor
   probably wants to know a match existed and was called off, not see a
   misleading empty state.
5. **Q5 — "Teammates' answers" visibility to visitors.** The "who uses it"
   table lists RSVP visibility under Player, and AC-3.4.1 implies the event
   page is open (doesn't require sign-in). Should a signed-out visitor see
   the per-answer counts (Going: 8, Maybe: 2, Not going: 1) but not the
   names, or see nothing RSVP-related at all?
   **Proposed default**: visitor sees counts only (useful for the "class
   projector view" use case named in the PDF); the list of *who* answered
   what is player-only, matching the "who uses it" table's player-only
   "teammates' answers" line.
