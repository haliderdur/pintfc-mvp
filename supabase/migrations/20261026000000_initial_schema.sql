-- PINT FC MVP — initial schema, views, and RLS policies.
-- See docs/design/data.md for the table-by-table rationale and
-- docs/design/rules.md / threats.md for what each policy defends against.

-- ========== enums ==========

create type player_position as enum ('gk', 'def', 'mid', 'fwd');
create type competition_type as enum ('league', 'friendly');
create type match_status as enum ('scheduled', 'cancelled', 'completed');
create type rsvp_answer as enum ('going', 'maybe', 'not_going');

-- ========== reference tables ==========

create table seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_current boolean not null default false
);

create table competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons (id),
  name text not null,
  type competition_type not null
);

create table opponents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  crest_url text
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text
);

-- ========== players ==========

create table players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id),
  full_name text not null,
  squad_number int not null,
  "position" player_position not null,
  dob date not null,
  email text not null,
  phone text not null,
  nationality text,
  photo_url text,
  is_archived boolean not null default false,
  is_minor boolean not null default false,
  guardian_consent boolean not null default false
);

create table player_consents (
  player_id uuid primary key references players (id),
  photo_consent boolean not null default false,
  nationality_consent boolean not null default false,
  stats_consent boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ========== matches ==========

create table matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id),
  opponent_id uuid not null references opponents (id),
  venue_id uuid not null references venues (id),
  kickoff_at timestamptz not null,
  rsvp_cutoff_at timestamptz,
  status match_status not null default 'scheduled'
);

-- rsvp_cutoff_at defaults to kickoff_at - 2h (D8) when not supplied; a
-- plain column DEFAULT can't reference another column, so a trigger does it.
create function set_default_rsvp_cutoff() returns trigger as $$
begin
  if new.rsvp_cutoff_at is null then
    new.rsvp_cutoff_at := new.kickoff_at - interval '2 hours';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger matches_default_rsvp_cutoff
  before insert or update on matches
  for each row execute function set_default_rsvp_cutoff();

create table match_results (
  match_id uuid primary key references matches (id),
  home_score int not null,
  away_score int not null,
  is_published boolean not null default false
);

create table player_stat_lines (
  match_id uuid not null references matches (id),
  player_id uuid not null references players (id),
  goals int not null default 0,
  assists int not null default 0,
  minutes int not null default 0,
  primary key (match_id, player_id)
);

create table standings_snapshot (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions (id),
  "position" int not null,
  team_name text not null,
  played int not null,
  won int not null,
  drawn int not null,
  lost int not null,
  points int not null,
  is_pintfc boolean not null default false
);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches (id),
  player_id uuid not null references players (id),
  answer rsvp_answer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, player_id)
);

create table trainings (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  location text not null
);

-- ========== row level security: default deny on every base table ==========

alter table seasons enable row level security;
alter table competitions enable row level security;
alter table opponents enable row level security;
alter table venues enable row level security;
alter table players enable row level security;
alter table player_consents enable row level security;
alter table matches enable row level security;
alter table match_results enable row level security;
alter table player_stat_lines enable row level security;
alter table standings_snapshot enable row level security;
alter table rsvps enable row level security;
alter table trainings enable row level security;

-- Open-read reference data: no per-row filtering needed, per data.md's
-- access matrix (anon and authenticated both get plain "read").
create policy seasons_read on seasons for select to anon, authenticated using (true);
create policy competitions_read on competitions for select to anon, authenticated using (true);
create policy opponents_read on opponents for select to anon, authenticated using (true);
create policy venues_read on venues for select to anon, authenticated using (true);
create policy matches_read on matches for select to anon, authenticated using (true);
create policy standings_read on standings_snapshot for select to anon, authenticated using (true);
create policy trainings_read on trainings for select to anon, authenticated using (true);

-- players: no anon/authenticated policy for other players' rows (T1, T3).
-- A player may read only their own full row (used by self-view, AC-4.3.3).
create policy players_self_select on players
  for select to authenticated
  using (auth_user_id = auth.uid());

-- player_consents: a player may read and update only their own row.
create policy player_consents_self_select on player_consents
  for select to authenticated
  using (player_id in (select id from players where auth_user_id = auth.uid()));

-- Turning a consent field OFF is always allowed; turning one ON is
-- blocked here if the player is a minor without guardian consent (T10,
-- AC-4.3.4) — the Route Handler returns a clean 403 first; this is the
-- backstop if that check is ever bypassed.
create policy player_consents_self_update on player_consents
  for update to authenticated
  using (player_id in (select id from players where auth_user_id = auth.uid()))
  with check (
    player_id in (select id from players where auth_user_id = auth.uid())
    and (
      (photo_consent = false and nationality_consent = false and stats_consent = false)
      or (select not (p.is_minor and not p.guardian_consent) from players p where p.id = player_consents.player_id)
    )
  );

-- match_results / player_stat_lines: no anon/authenticated policy at all
-- on the base tables — unpublished results and consent-gated stat lines
-- are only reachable through the public-safe views below (T1, T4).

-- rsvps: a player may read and write only their own row (T1, T3); writes
-- are also blocked once the cutoff has passed (T2) — this is the actual
-- enforcement point, not just the UI's disabled button.
create policy rsvps_self_select on rsvps
  for select to authenticated
  using (player_id in (select id from players where auth_user_id = auth.uid()));

create policy rsvps_self_insert on rsvps
  for insert to authenticated
  with check (
    player_id in (select id from players where auth_user_id = auth.uid())
    and now() < (select rsvp_cutoff_at from matches where id = rsvps.match_id)
  );

create policy rsvps_self_update on rsvps
  for update to authenticated
  using (player_id in (select id from players where auth_user_id = auth.uid()))
  with check (
    player_id in (select id from players where auth_user_id = auth.uid())
    and now() < (select rsvp_cutoff_at from matches where id = rsvps.match_id)
  );

-- ========== public-safe views ==========
-- Owned by the migration role (not `anon`/`authenticated`), so they read
-- the base tables with the view owner's privileges and bypass the RLS
-- policies above — the view's own WHERE/CASE logic is what does the
-- filtering, in one place, per rules.md §2/§3.

create view public_players as
select id, full_name, squad_number, "position"
from players
where is_archived = false;

create view public_profile as
select
  p.id,
  p.full_name,
  p.squad_number,
  p."position",
  case
    when p.is_minor and not p.guardian_consent then null
    when pc.nationality_consent then p.nationality
    else null
  end as nationality,
  case
    when p.is_minor and not p.guardian_consent then null
    when pc.photo_consent then p.photo_url
    else null
  end as photo_url,
  (pc.stats_consent and not (p.is_minor and not p.guardian_consent)) as stats_visible
from players p
join player_consents pc on pc.player_id = p.id
where p.is_archived = false;

create view public_match_results as
select match_id, home_score, away_score
from match_results
where is_published = true;

create view public_player_stat_lines as
select sl.match_id, sl.player_id, sl.goals, sl.assists, sl.minutes
from player_stat_lines sl
join players p on p.id = sl.player_id
join player_consents pc on pc.player_id = p.id
where p.is_archived = false
  and pc.stats_consent = true
  and not (p.is_minor and not p.guardian_consent);

create view public_rsvp_counts as
select
  match_id,
  count(*) filter (where answer = 'going') as going,
  count(*) filter (where answer = 'maybe') as maybe,
  count(*) filter (where answer = 'not_going') as not_going
from rsvps
group by match_id;

-- Who-answered-what, without reasons (R7) — player-only, never granted
-- to anon (AC-3.3.5, D7/Q5: visitors get counts only).
create view player_rsvp_roster as
select r.match_id, r.player_id, p.full_name, r.answer
from rsvps r
join players p on p.id = r.player_id
where p.is_archived = false;

grant select on public_players to anon, authenticated;
grant select on public_profile to anon, authenticated;
grant select on public_match_results to anon, authenticated;
grant select on public_player_stat_lines to anon, authenticated;
grant select on public_rsvp_counts to anon, authenticated;
grant select on player_rsvp_roster to authenticated;
