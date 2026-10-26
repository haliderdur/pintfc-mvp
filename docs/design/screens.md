# Screens

Look: "Sport" (look B), light theme only, phone-first. Hard gates on every
screen: no horizontal scroll at 320px width (AC-5.4), WCAG AA contrast
(AC-5.2).

Shared header (all pages): signed-out shows a "Sign in" link
(`data-testid="header-signin"`); signed-in shows the player's name plus
"Sign out" (`header-signout`) and "Sign out everywhere"
(`header-signout-all`).

## `/` — Home

| State | Trigger | Shown |
|---|---|---|
| Loading | initial render | skeleton cards for each section |
| Loaded | data present | next-match card w/ countdown (`home-next-match`, `home-countdown`), season record (`home-record`), latest results (`home-results-list`), mini league table (`home-league-table`), squad teaser (`home-squad-teaser`) |
| Empty — no upcoming match | no scheduled/cancelled match in the future | `home-next-match-empty` |
| Empty — no results yet | zero published results | `home-results-empty` |
| Cancelled next match | next match's status = `cancelled` (D: Q4 default) | `home-next-match` renders with a "Cancelled" badge instead of a live countdown |
| Error | data fetch failed | `home-error` generic retry message |

## `/squad`

| State | Shown |
|---|---|
| Loading | skeleton list |
| Loaded | players grouped by position, each a link (`squad-player-{id}`) to their profile; archived player never present |
| Empty | `squad-empty` (defensive only — seed always has 40 active players) |

## `/players/[id]`

| State | Shown |
|---|---|
| Loading | skeleton profile |
| Loaded | only consent-visible fields (`profile-field-photo`, `profile-field-nationality`, `profile-field-stats`, always-shown `profile-name`, `profile-number`, `profile-position`) |
| Not found | archived player id or unknown id → real 404 page |

## `/fixtures/[id]` (the event page / class projector view)

| State | Shown |
|---|---|
| Loading | skeleton |
| Loaded, signed out | counts only (`fixture-count-going`, `fixture-count-maybe`, `fixture-count-not-going`), no RSVP control, no per-player roster |
| Loaded, signed in, RSVP open | counts + roster of who answered what (`fixture-roster`) + RSVP control (`fixture-rsvp-going`, `fixture-rsvp-maybe`, `fixture-rsvp-not-going`) |
| Loaded, signed in, RSVP closed | same as above but RSVP control replaced by a disabled state labeled "RSVP closed" (`fixture-rsvp-closed`) |
| Error | `fixture-error` |

Live: polls `GET /api/fixtures/[id]/summary` every 10s while the tab is
visible (`rules.md` §5); counts and roster update in place without a full
reload.

## `/sign-in`

| State | Shown |
|---|---|
| Form | email + password fields (`signin-email`, `signin-password`), submit (`signin-submit`) |
| Submitting | submit button disabled, spinner |
| Error | `signin-error` — generic "incorrect email or password" (AC-1.1.3, no user enumeration) |

## `/privacy` (player-only; redirects to `/sign-in` if signed out)

| State | Shown |
|---|---|
| Loading | skeleton |
| Loaded | three toggles (`privacy-toggle-photo`, `privacy-toggle-nationality`, `privacy-toggle-stats`) |
| Locked (minor, no guardian consent) | opt-in toggles rendered disabled/locked (`privacy-toggle-photo-locked`, etc.) with an explanatory note, matching the server's `FORBIDDEN_MINOR_CONSENT` rule |
| Saving | toggle shows a saving indicator |
| Saved | brief confirmation (`privacy-saved`) |
| Error | `privacy-error` |
