# Data model

All timestamps are `timestamptz`, stored and compared in UTC (see `rules.md`
and Risk R1 in `docs/REQUIREMENTS.md`). All tables live in the `public`
schema of the single Supabase project.

## Tables

### `players`
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| auth_user_id | uuid, unique, fk → `auth.users.id` | one seeded login per player |
| full_name | text | public |
| squad_number | int | public |
| position | enum (`gk`,`def`,`mid`,`fwd`) | public |
| dob | date | **never public** (AC-4.3.1) |
| email | text | **never public** |
| phone | text | **never public** |
| nationality | text | public only if `nationality_consent` |
| photo_url | text | public only if `photo_consent` |
| is_archived | boolean | if true, never returned to any client (AC-4.1.2) |
| is_minor | boolean | computed at seed time from `dob` |
| guardian_consent | boolean | required `true` before any opt-in consent field can show, if `is_minor` |

### `player_consents`
| Column | Type | Notes |
|---|---|---|
| player_id | uuid pk, fk → players | |
| photo_consent | boolean | |
| nationality_consent | boolean | |
| stats_consent | boolean | |
| updated_at | timestamptz | |

Kept separate from `players` so the consent row has its own, narrow RLS
write policy (a player may update only their own consent row — nothing
else about themselves is editable in this MVP).

### `seasons`, `competitions`, `opponents`, `venues`
Standard reference data. `competitions.type` is `league` or `friendly`,
`competitions.season_id` → `seasons`, `seasons.is_current` marks the one
active season.

### `matches`
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| competition_id | uuid fk | |
| opponent_id | uuid fk | |
| venue_id | uuid fk | |
| kickoff_at | timestamptz | |
| rsvp_cutoff_at | timestamptz | default `kickoff_at - interval '2 hours'` (D8) |
| status | enum (`scheduled`,`cancelled`,`completed`) | |

### `match_results`
| Column | Type | Notes |
|---|---|---|
| match_id | uuid pk, fk → matches | |
| home_score, away_score | int | |
| is_published | boolean | unpublished rows excluded from every read path (AC-2.2.2) |

### `player_stat_lines`
| Column | Type | Notes |
|---|---|---|
| match_id, player_id | composite pk, fks | |
| goals, assists, minutes | int | public only if that player's `stats_consent` is true |

### `standings_snapshot`
Static seeded rows per competition: `position, team_name, played, won,
drawn, lost, points, is_pintfc`. No standings-sync logic (out of scope) —
this table is simply read as-is.

### `rsvps`
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| match_id | uuid fk | |
| player_id | uuid fk | |
| answer | enum (`going`,`maybe`,`not_going`) | |
| created_at, updated_at | timestamptz | |
| — | unique (match_id, player_id) | one answer per player per match (AC-3.3.2) |

### `trainings`
Seeded (`starts_at`, `location`) per the PDF's seed-data section, but **not
read by any in-scope screen** — no FR references trainings. Kept only so
the seed script matches the spec; flagged in `DECISIONS.md` D6.

## Access matrix

| Table / view | Visitor (anon) | Player (self) | Player (other players' rows) | Write path |
|---|---|---|---|---|
| `public_players` (view: active players, public fields only) | read | read | read | none (client never writes `players` directly) |
| `players` (base table) | **no access** | read own full row | **no access** | seed/service role only |
| `player_consents` | no access | read + write own row | no access | player writes own row only (RLS) |
| `public_profile(player_id)` (view: consent-filtered fields, minor-aware) | read | read (own row shows full data instead, via app logic) | read | n/a |
| `seasons`, `competitions`, `opponents`, `venues` | read | read | read | seed/service role only |
| `matches` | read | read | read | seed/service role only |
| `match_results` (filtered to `is_published`) | read | read | read | seed/service role only |
| `player_stat_lines` (filtered by `stats_consent`) | read | read | read | seed/service role only |
| `standings_snapshot` | read | read | read | seed/service role only |
| `public_rsvp_counts(match_id)` (view: aggregated counts only) | read | read | read | n/a |
| `rsvps` (base table) | **no access** | read + write **own row only**, only when `now() < matches.rsvp_cutoff_at` | read via `public_rsvp_counts`/player-only roster view, never the base table directly | player writes own row; service role for seed |
| `trainings` | read (unused by UI) | read (unused by UI) | read | seed/service role only |

This matrix is what `rules.md`'s permission functions encode and what
`threats.md`'s controls defend — it also becomes the database-level test
suite in `test-map.md` (one test per cell that denies access).

### Enforcement strategy

1. **RLS on every base table**, default deny.
2. **Public-safe views** (`public_players`, `public_profile`,
   `public_rsvp_counts`, published-only `match_results`) do the field/row
   filtering once, in SQL, so no two app code paths can filter differently.
3. **RLS policies on `rsvps` writes** check both `player_id = (select id
   from players where auth_user_id = auth.uid())` and
   `now() < (select rsvp_cutoff_at from matches where id = match_id)` — so
   even a direct `PATCH` to Supabase's REST API with a valid player JWT
   cannot RSVP as someone else or after the cutoff (Risk R3).
4. **API Route Handlers re-check** the same rules before calling Supabase,
   purely to return a clean error code/message — RLS remains the actual
   security boundary even if a Route Handler had a bug.
