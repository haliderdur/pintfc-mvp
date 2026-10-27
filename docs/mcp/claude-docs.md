# claude-docs (claude.ai Claude Docs)

**Scope:** claude.ai account-level, not project config
**Tools:** 8

## What it is

The claude.ai Claude Docs MCP server exposes claude.ai's living-document
feature (create, read, update, comment) as MCP tools, so Claude can produce
a shareable, collaboratively-editable document on claude.ai directly from
a conversation instead of only outputting text or a local file.

## Why it's here

Lets Claude create and edit living documents on claude.ai during planning
conversations (e.g. drafting a design doc or write-up that gets shared and
commented on) rather than only producing local Markdown files. Not used for
this project's actual tracked docs (`docs/design/*.md`, `PROGRESS.md`,
`DECISIONS.md`) — those stay as plain files in the repo so they're
versioned with the code, per the agentic-SDLC workflow in `CLAUDE.md`.
