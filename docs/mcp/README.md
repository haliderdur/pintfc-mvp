# MCP servers used on this project

This is a documentation index, not a config file — Claude Code reads MCP
server definitions only from `.mcp.json` (project-level, checked into this
repo) and the user-level `~/.claude.json`. This folder exists to summarize,
for anyone reviewing the project, which MCP servers are wired up and why.

| Server | What it is | Scope | Config location | Tools | Purpose |
|---|---|---|---|---|---|
| [`github`](./github.md) | Remote code repository | Project | `.mcp.json` | 22 | Repo/issue/PR lookups against `haliderdur/pintfc-mvp` |
| [`supabase`](./supabase.md) | Project database | Project | `.mcp.json` | 13 | Read-only schema/RLS/table/log access to this project's Supabase database |
| [`playwright`](./playwright.md) | Browser automation | User | `~/.claude.json` | 25 | Browser automation, used alongside this repo's own Playwright e2e suite |
| [`vercel`](./vercel.md) | Hosting platform | Built-in (plugin) | n/a | 238 | Deployments, env vars, logs, domains for the Vercel-hosted app |
| [`claude-docs`](./claude-docs.md) | Living documents | claude.ai | n/a | 8 | Living docs created/edited during planning conversations |

Run `/mcp` in a Claude Code session to see live connection status for all
five.

## Where each one is actually configured

This folder is documentation, not configuration — don't point to it alone
as "where the MCPs are." Only one server is defined inside this repo:

- **`github`** and **`supabase`** — both configured in this repo, at
  `.mcp.json` (project root). These are the only two servers whose
  definitions live in the project's own files. Both read their tokens
  from the gitignored `.env.local` via `scripts/mcp-env.cjs`, a small
  wrapper that loads the file and substitutes secrets before launching
  the real MCP server — no OS-level environment variable is required for
  either.
- **`playwright`** — configured outside this repo entirely, in the user's
  `~/.claude.json`. It is available to this project only because it's
  available to every project for this user.
- **`vercel`** — a built-in Claude Code plugin. No config file, in this
  repo or otherwise; it ships with Claude Code's Vercel integration.
- **`claude-docs`** — tied to the claude.ai account, not to any file.

So: "where is `github` configured" → `.mcp.json`. "Where are `playwright`
/ `vercel` / `claude-docs` configured" → not in this repo at all.

## Security note

`.mcp.json` is checked into git, so neither the `github` nor `supabase`
token is written into it directly. Both are read at launch time from the
gitignored `.env.local` by `scripts/mcp-env.cjs`, consistent with this
project's `CLAUDE.md` secrets rule ("keys live in `.env.local`"). No other
server in this list requires a project-level secret.
