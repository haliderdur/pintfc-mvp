# vercel

**Scope:** Built-in plugin (bundled with Claude Code's Vercel integration,
not declared in this repo's `.mcp.json`)
**Tools:** 238

## What it is

Vercel's MCP server exposes its hosting platform — deployments, projects,
environment variables, domains, logs, observability, feature flags, and
more — as MCP tools. It's the programmatic equivalent of the `vercel` CLI
and dashboard, but callable directly by an agent as structured tool calls
rather than shell commands or manual clicks.

## Why it's here

This project deploys to Vercel (`halid-s-team`, per `CLAUDE.md`). The
Vercel MCP server gives Claude Code direct access to that platform —
deployments, build logs, environment variables, domains, runtime
errors/logs, and project configuration — instead of shelling out to the
`vercel` CLI for every check.

In practice on this project it's used for things like: checking a
deployment's build/runtime logs after a push, listing/diffing environment
variables (`VERCEL_TOKEN` et al. from `.env.local`), and project status —
never for creating resources or production deploys without the owner's
sign-off first, per `CLAUDE.md`'s "before creating cloud resources" rule.

## Representative tools (of 238)

- `list_deployments`, `get_deployment`, `get_runtime_errors`, `get_runtime_logs`
- `list_projects`, `get_project`, `filter_project_envs`, `edit_project_env`
- `list_project_domains`, `get_domain`
- `create_deployment` (not used without explicit owner approval, per project rules)
