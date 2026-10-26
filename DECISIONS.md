# Decisions

One line per decision and why. Append, don't rewrite history.

- **D1 — Stack unchanged**: Next.js App Router + TypeScript, Supabase
  Postgres + Auth, Vitest, Playwright, as given in the brief. No deviation
  needed for this MVP's scope.
- **D2 — Privacy enforced via Postgres RLS + public-safe views as the
  primary boundary, API checks as a secondary layer**: a visitor or an
  authenticated player can call the Supabase API/DB directly with the anon
  key or their own JWT, bypassing the Next.js app entirely (Risks R2/R3 in
  `docs/REQUIREMENTS.md`). Only a database-level control actually stops
  that.
- **D3 — All timestamps `timestamptz` in UTC; cutoff compared server-side
  in UTC**: closes Risk R1 (timezone/DST correctness for kickoff times and
  the RSVP cutoff).
- **D4 — Preview and production deployments share one Supabase project**:
  only one project is provisioned and Supabase branching needs a paid
  add-on (Risk R5 assumes free tier). Mitigation: reseed (idempotent
  truncate + reseed) before any class demo; see `docs/design/threats.md`
  T7.
- **D5 — Auth via Supabase email+password with seeded fake accounts, one
  per player, cookie-based session via `@supabase/ssr`**: matches the
  "fake login" requirement and avoids building/maintaining an OAuth or
  email-delivery flow that has no real use with fake data.
- **D6 — Weekly trainings are seeded but not surfaced in any MVP screen**:
  no FR in scope references trainings; the seed-data section lists them
  for realism / a future schedule feature (explicitly out of scope).
- **D7 — Signed-out visitors see fixture RSVP counts but not the roster of
  who answered what**: resolves `docs/REQUIREMENTS.md` Q5's default,
  matching the "who uses it" table's player-only "teammates' answers."
- **D8 — RSVP cutoff defaults to 2 hours before kickoff**: resolves Q2's
  default; stored per-match so it's trivially reconfigurable later.
- **D9 — The seeded class-demo match's cutoff defaults to "2 hours from
  seed-script run time"** until a real class date/time is provided:
  resolves Q1's default.
- **D10 — Assume the Supabase project is on the Free tier** until
  confirmed (Q3's default): the main consequence of being wrong is extra
  headroom, not a blocker, so it's safe to proceed and correct later.
- **D11 — RSVP and privacy-settings endpoints trust `SameSite=Lax` session
  cookies as adequate CSRF protection for this MVP** (`docs/design/
  threats.md` T8): acceptable given fake data and no payment flows;
  revisit if real PII is ever introduced.
- **D12 — No local Supabase instance; Session 01's database tests run
  directly against the shared remote project**: Docker Desktop isn't
  available in this environment (neither the CLI's bash nor PowerShell
  can see a `docker` binary), so `supabase start` isn't an option.
  Migrations and the seed script run against `dgrjyksawdongzxpkjey`
  (owner's explicit go-ahead given in session). Consequence: preview/
  prod/dev now share state even earlier than D4 anticipated — re-seed
  before any demo (`docs/design/threats.md` T7).
- **D13 — Schema/view writes go through the Supabase Management API's
  `database/query` endpoint when `supabase db push`'s role-bootstrap
  flow is unavailable**, falling back to `db push` once a token with
  `database_write` scope is present. Recorded because the first
  `SUPABASE_ACCESS_TOKEN` in `.env.local` was scoped without that
  permission (confirmed via a `CREATE TABLE ... read-only transaction`
  error) — the owner generated a replacement token with full access
  mid-session.
