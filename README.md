# PINT FC MVP

A club website with a "Going / Not going" RSVP flow, built as a teaching
MVP. See `CLAUDE.md` for the project's working rules and `docs/` for the
requirements and design this build follows.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) Postgres + Auth
- [Vitest](https://vitest.dev) for unit/API/database-level tests
- [Playwright](https://playwright.dev) for end-to-end tests
- Hosted on [Vercel](https://vercel.com)

## Project docs

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) — the 38 in-scope
  acceptance checks, owner decisions, risks, and open questions.
- [`docs/design/`](docs/design) — architecture, data model + RLS access
  matrix, API contracts, shared rules, screens, threats/controls, and
  the test map (one owning test per acceptance check).
- [`plans/`](plans) — the session-by-session build plan.
- [`DECISIONS.md`](DECISIONS.md) — a running log of decisions and why.
- [`PROGRESS.md`](PROGRESS.md) — what's done per session, with exit-gate
  proof.

## Getting started

```bash
npm install
```

Copy the Supabase project's URL/keys and the Vercel/Supabase CLI tokens
into `.env.local` (gitignored — see `CLAUDE.md`'s secrets rule; this repo
has no `.env.example` with real-shaped values on purpose, ask the owner
for the project's own `.env.local`).

```bash
npm run seed     # idempotent: truncate + reseed all fake season/player/match data
npm run dev      # http://localhost:3000
```

Seeded fake player logins are written to a local, gitignored
`seed-logins.md` by `npm run seed` — they're never printed to the
console or committed.

## Testing

```bash
npm run test       # Vitest: unit + database + API-level tests
npm run test:e2e   # Playwright: end-to-end tests (builds + starts the app first)
npm run plan-check # fails if any of the 38 acceptance checks has no (or >1) owning test
npm run lint
npx tsc --noEmit
```

There is no local Supabase instance in this environment (Docker isn't
available) — tests run directly against the project's real Supabase
database. See `DECISIONS.md` D12.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` / `npm run start` | Production build / start |
| `npm run seed` | Idempotent truncate + reseed of all fake data |
| `npm run test` | Vitest (unit, database, API-level) |
| `npm run test:e2e` | Playwright (end-to-end) |
| `npm run plan-check` | Verifies all 38 ACs have exactly one owning test |
| `npm run lint` | ESLint |
