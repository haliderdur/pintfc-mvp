# supabase

**Scope:** Project (`.mcp.json`)
**Transport:** stdio, `npx -y @supabase/mcp-server-supabase@latest`
**Auth:** `SUPABASE_ACCESS_TOKEN` — read from the gitignored `.env.local`
(same variable already used for app/CLI access), loaded by
`scripts/mcp-env.cjs` (see Setup notes) — no OS-level environment variable
needed
**Access:** read-only (`--read-only`)
**Scoped to:** `--project-ref=dgrjyksawdongzxpkjey` ("Halid's Project", per
`CLAUDE.md`)
**Tools:** 13

## What it is

Supabase's official MCP server. It exposes a Supabase project — tables,
migrations, RLS policies, logs, and (optionally) the ability to run SQL —
as MCP tools, so an agent can inspect or query the project directly instead
of going through the Supabase dashboard or `supabase` CLI by hand.

## Why it's here

This project's database (schema, RLS policies, views, seed data — see
Session 01 in `PROGRESS.md`) lives entirely in Supabase. Read-only access
lets Claude Code check the live schema, RLS policies, and table contents
directly when debugging a test failure or verifying a migration, without
risking a write to the real shared project — consistent with `CLAUDE.md`'s
"ask the owner before creating anything in Supabase" rule and the project's
general "no local Supabase instance, all dev happens against the real
project" situation (D12 in `DECISIONS.md`).

## Representative tools (of 13)

- `list_tables`, `list_extensions`, `list_migrations`
- `execute_sql` (read-only — blocked at the server/flag level for writes)
- `get_advisors` (security/performance advisories)
- `get_project_url`, `get_publishable_keys`
- `query_logs`, `list_edge_functions`, `get_edge_function`
- `generate_typescript_types`

## Setup notes

- `SUPABASE_ACCESS_TOKEN` only needs to exist in `.env.local`. `.mcp.json`
  runs `node scripts/mcp-env.cjs npx -y @supabase/mcp-server-supabase@latest
  ...` — the wrapper script reads `.env.local` into its own process
  environment and spawns the real server with that environment inherited,
  so the server sees `SUPABASE_ACCESS_TOKEN` without it ever needing to be
  a separate OS-level variable.
- No VS Code/terminal restart is needed after changing the token in
  `.env.local` — the wrapper re-reads the file on every MCP server launch.
  (Compare `github.md`'s original note: that workaround was only needed
  before switching to this wrapper-script approach.)
- Verify with `/mcp` inside a Claude Code session — `supabase` should show
  as connected under Project MCPs.
