# Architecture

## Parts

- **Web app**: Next.js (App Router, TypeScript), deployed as a single Vercel
  project on team `halid-s-team`.
- **Rendering**: React Server Components do the data reads (home page, squad,
  profiles, fixture page) directly against Supabase using a server-side
  Supabase client — no bespoke read API needed for most of the app.
- **Writes and polling**: a small set of Next.js Route Handlers
  (`app/api/**/route.ts`) for the actions that need a stable JSON contract
  from a client component: sign-in/out, RSVP submit, privacy-settings save,
  and the fixture-summary poll. See `api.md`.
- **Database + Auth**: Supabase Postgres (project `dgrjyksawdongzxpkjey`,
  "Halid's Project", region eu-central-1) and Supabase Auth (email+password,
  one seeded fake account per player).
- **Seed script**: a Node script (`scripts/seed.ts`) run with the Supabase
  service-role key, never shipped to the client, producing all fake season/
  player/match/RSVP data described in `docs/REQUIREMENTS.md`.

## Where the API runs

Route Handlers run as Vercel serverless functions (Node runtime, not Edge —
the privacy/consent and cutoff logic needs full Postgres access via the
Supabase JS client, and Edge's fetch-only constraints add no benefit here).
Server Components also run server-side on Vercel at request time (no static
export — the data is live).

## How sign-in works

- Supabase Auth, email+password. Each seeded player gets a real
  `auth.users` row with a fake, deterministic email (e.g.
  `p07.midfielder@pintfc.test`) and a known fake password, listed only in
  the seed script output / a local `seed-logins.md` (gitignored) — never in
  a tracked file, since CLAUDE.md requires no real PII and no secrets
  committed (these are fake but still treated as credentials).
- Session handling via `@supabase/ssr`: the server sets httpOnly, `Secure`,
  `SameSite=Lax` cookies scoped to the current deployment's domain. Server
  Components and Route Handlers both read the session from these cookies —
  no client-side `localStorage` session, which would survive in a way that
  fights "sign out of all devices."
- **Sign out of all devices** uses Supabase's global sign-out (revokes all
  refresh tokens for that user), not just clearing the local cookie — this
  is what makes AC-1.6.2/1.6.3 actually work across devices, not just
  across tabs.

## Environments

| Environment | Where | Database |
|---|---|---|
| **Local** | `next dev`, Supabase CLI (`supabase start`, Docker-backed local Postgres + Auth) | Local Supabase instance, seeded by the same `scripts/seed.ts` against the local connection string. |
| **Preview** | Vercel preview deployments (one per pushed branch/PR) | The same remote Supabase project (`dgrjyksawdongzxpkjey`) as production — see DECISIONS.md D4. |
| **Production** | Vercel production deployment on `halid-s-team`, opened to students only with the owner's go | Same remote Supabase project, production schema/data (re-seeded before each class/demo). |

Because preview and production share one Supabase project (free tier has no
branching), a preview deploy's RSVP writes land in the same data students
will see in production. Mitigation: re-run the idempotent seed script
(truncate + reseed) before any class demo, and avoid exercising writes
against the shared project from ad hoc preview testing close to a demo.

## Local dev without Docker

Docker Desktop is required for `supabase start` (local Postgres + Auth).
It's now installed (Phase 0) but needs to be launched once, with WSL2
integration enabled, before `supabase start` works. Until then, local
development can point `.env.local` at the remote dev project instead,
accepting slower iteration and shared state with preview/production.
