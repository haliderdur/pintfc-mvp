# Session backlog

Order follows the dependency chain in `docs/REQUIREMENTS.md` ("Dependencies
between requirements"): schema/seed → auth → home/squad/profiles → privacy
→ RSVP → release gate. One session at a time, per CLAUDE.md.

| # | Session | ACs owned (from `docs/design/test-map.md`) | Count |
|---|---|---|---|
| 01 | Foundation — schema, RLS, views, seed | 2.2.2, 2.4.2, 3.3.4, 3.3.6, 4.1.2, 4.2.2 | 6 |
| 02 | Auth and sessions | 1.1.1, 1.1.3, 1.1.4, 1.6.1, 1.6.2, 1.6.3, 1.6.4 | 7 |
| 03 | Home page | 2.1.1–2.1.6, 2.2.1, 2.2.3, 2.2.4, 2.3.1, 2.3.2, 2.4.1, 2.4.3 | 13 |
| 04 | Squad and profiles | 4.1.1, 4.1.3, 4.2.1, 4.3.1, 4.3.3 | 5 |
| 05 | Privacy settings | 4.3.2, 4.3.4 | 2 |
| 06 | RSVP and fixture page | 3.3.1, 3.3.2, 3.3.5, 3.4.1, 3.4.3 | 5 |
| 07 | Release gate | design gates (AC-5.2, AC-5.4) across all screens, full suite, deploy | 0 (verification only) |

**Total: 38/38 ACs**, each owned by exactly one session, matching
`test-map.md`'s one-owner-per-check rule. `scripts/plan-check.mjs` (built in
Session 01) checks this mapping stays exhaustive and non-overlapping as
sessions land.

Each `plans/session-NN-*.md` is written and approved before that session is
built; a session isn't started until the previous one's exit gate has run
and passed. After each session, append to `PROGRESS.md` per CLAUDE.md
(what's done, exit-gate output, decisions, "next session needs to know").
