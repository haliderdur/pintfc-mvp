# playwright

**Scope:** User (`~/.claude.json`) — available across all of this user's
projects, not committed to this repo
**Tools:** 25

## What it is

The Playwright MCP server wraps Microsoft's Playwright browser-automation
library behind the MCP protocol, so an AI agent can drive a real browser —
navigate, click, type, read the DOM/console/network — through tool calls
instead of generated code that has to be run separately. It's the same
underlying engine this project's own `tests/e2e/*.spec.ts` suite uses, just
exposed as interactive tools rather than a test runner.

## Why it's here

Gives Claude Code a live, driveable browser (navigate, click, fill forms,
take snapshots/screenshots, read console/network) independent of this
project's own Playwright **test suite** (`tests/e2e/*.spec.ts`, run via
`npx playwright test`). The two are separate uses of the same underlying
library:

- The project's Playwright tests are checked-in, repeatable specs that are
  part of each session's exit gate (see `PROGRESS.md`).
- This MCP server is an interactive tool Claude Code itself can use during
  a conversation — e.g. to manually click through `/squad` or `/fixtures/[id]`
  and confirm a change actually renders, per this project's "test the golden
  path in a browser before reporting UI work complete" rule.

## Representative tools

- `browser_navigate`, `browser_click`, `browser_type`, `browser_fill_form`
- `browser_snapshot`, `browser_take_screenshot`
- `browser_console_messages`, `browser_network_requests`
- `browser_wait_for`, `browser_evaluate`
