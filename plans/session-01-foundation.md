# Session 01 — Foundation: schema, RLS, views, seed script

## Goal

Stand up the Next.js app skeleton and the full Supabase schema (tables,
views, RLS policies) from `docs/design/data.md`, plus the idempotent seed
script from `docs/REQUIREMENTS.md`'s seed-data section. Nothing here has a
screen yet — this session proves the data layer enforces the rules on its
own, directly against Postgres/Supabase Auth, before any UI exists.

## Scope (owned ACs, per `docs/design/test-map.md`)

- AC-2.2.2 (database) — unpublished result excluded from reads
- AC-2.4.2 (database) — archived player excluded from the squad-teaser read
- AC-3.3.4 (database) — RSVP write rejected once cutoff has passed
- AC-3.3.6 (database) — RSVP write rejected for any `player_id` but the
  caller's own
- AC-4.1.2 (database) — archived player excluded from `public_players`
- AC-4.2.2 (database) — minor's opt-in fields hidden when guardian consent
  is false, regardless of the player's own consent flags

## Tasks

1. `npx create-next-app` (App Router, TypeScript) into the repo root;
   wire `npm run dev/build/lint/test`.
2. `supabase init`, link to project `dgrjyksawdongzxpkjey`; write
   migrations for every table in `data.md` (`players`, `player_consents`,
   `seasons`, `competitions`, `opponents`, `venues`, `matches`,
   `match_results`, `player_stat_lines`, `standings_snapshot`, `rsvps`,
   `trainings`).
3. RLS: default-deny on every base table; policies per the access matrix
   in `data.md` (player self-read/write on `player_consents` and `rsvps`,
   cutoff + own-row checks on `rsvps` writes).
4. Views: `public_players`, `public_profile(player_id)`,
   `public_rsvp_counts(match_id)`, published-only `match_results` read
   path — per `rules.md` §2 and §3.
5. `lib/rules/cutoff.ts` and `lib/rules/visibility.ts` (TS mirrors of the
   DB rules, unit-testable without a database).
6. `scripts/seed.ts` (service-role key, idempotent truncate+reseed):
   1 current season, 1 league + 1 friendly competition, 40 active
   players (incl. 2 U18s — one guardian-consented, one not — mixed
   photo/nationality/stats consent), 1 archived player, past league
   results (published) + 1 friendly + 1 unpublished result, upcoming
   matches incl. 1 cancelled, 1 class-demo match with cutoff = seed-run
   time + 2h (D9, pending Q1), 1 standings snapshot, weekly trainings
   (D6 — seeded, unused by UI). Writes fake logins to gitignored
   `seed-logins.md`, never to a tracked file.
7. `scripts/plan-check.mjs`: parses `docs/design/test-map.md`, fails if
   any of the 38 AC ids has zero or more than one owning test.

## Exit gate

- `npm run build` exits 0.
- `node scripts/plan-check.mjs` exits 0 (38/38, one owner each).
- Database-level test suite (Vitest against a local/preview Supabase
  instance using seeded fake player JWTs and the anon key) covers this
  session's 6 ACs and `docs/design/threats.md` T1–T4, T6, T9; all pass,
  output shown in the session's `PROGRESS.md` entry.
- `npx tsc --noEmit` exits 0.

## Out of scope for this session

Any screen, any Route Handler, sign-in flow UI — those start in
Session 02.
