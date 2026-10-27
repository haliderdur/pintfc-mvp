# github

**Scope:** Project (`.mcp.json`)
**Transport:** stdio bridge (`mcp-remote`) to the remote HTTP endpoint
`https://api.githubcopilot.com/mcp/`
**Auth:** `Authorization: Bearer <token>` — token comes from `GITHUB_MCP_PAT`
in the gitignored `.env.local`, loaded by `scripts/mcp-env.cjs` (see
Setup notes), never committed
**Access:** read-only (`X-MCP-Readonly: true`)
**Toolsets enabled:** `repos`, `issues`, `pull_requests` (22 tools)

## What it is

The GitHub MCP Server (`api.githubcopilot.com/mcp/`) is GitHub's own hosted
Model Context Protocol server. MCP is an open protocol that lets an AI
agent call a fixed set of tools over a standard interface instead of the
agent having to know a bespoke API or CLI; GitHub exposes its repos,
issues, and pull requests this way so any MCP-compatible client (Claude
Code, other agents, IDEs) can query GitHub the same way.

## Why it's here

Lets Claude Code query this repo's GitHub state directly — branches,
commits, PRs, issues — without shelling out to `gh` or asking the user to
paste data in. Scoped read-only and to three toolsets on purpose: this
project doesn't need Claude to open PRs or write to GitHub through MCP, only
to look things up.

## Representative tools

- `search_repositories`, `list_branches`, `list_commits`, `get_commit`
- `list_pull_requests`, `pull_request_read`, `search_pull_requests`
- `list_issues`, `issue_read`, `search_issues`
- `get_file_contents`, `search_code`

## Setup notes

- `GITHUB_MCP_PAT` lives only in `.env.local` — no OS-level environment
  variable is needed. `.mcp.json` runs `node scripts/mcp-env.cjs npx -y
  mcp-remote ...`: the wrapper script reads `.env.local`, substitutes
  `{{GITHUB_MCP_PAT}}` into the `Authorization` header arg, then spawns
  `mcp-remote` (a stdio↔HTTP bridge) with that header. This avoids the
  "OS env var must exist before the process starts" problem entirely,
  since the wrapper itself reads the file fresh on every launch.
- The server was originally configured as a direct `"type": "http"` entry
  with `${GITHUB_MCP_PAT}` substitution — that only works via an OS
  environment variable, since Claude Code resolves that substitution
  itself (there's no subprocess to inject `.env.local` into). Switched to
  the `mcp-remote` bridge specifically so a wrapper script could take over
  that substitution instead.
- Verify connection with `/mcp` inside a Claude Code session. If it fails,
  try running the same command manually in a terminal (`node
  scripts/mcp-env.cjs npx -y mcp-remote https://api.githubcopilot.com/mcp/
  --header "Authorization:Bearer <token>"`) to see `mcp-remote`'s own
  error output — header flag syntax can vary by version.
