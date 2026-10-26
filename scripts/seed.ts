// Idempotent truncate + reseed of all fake season/player/match/RSVP data
// described in docs/REQUIREMENTS.md. Uses the service-role key (full DB
// access, bypasses RLS) — never import this file from app/ or components/.
//
// Run with: npm run seed
//
// Fake player logins (email + one shared fake password) are written only
// to the gitignored seed-logins.md — never printed to the console and
// never committed (CLAUDE.md secrets rule; architecture.md).

try {
  // @ts-expect-error -- loadEnvFile is available on Node 20.12+/22+, not yet in @types/node's lib.
  process.loadEnvFile(".env.local");
} catch {
  // ignore if already loaded (e.g. by a test runner)
}

import { writeFileSync } from "node:fs";
import { createServiceRoleClient } from "../lib/supabase/service-role";
import { SEED_EMAIL_DOMAIN as EMAIL_DOMAIN, SEED_FAKE_PASSWORD as FAKE_PASSWORD } from "../lib/seed-constants";

const supabase = createServiceRoleClient();

const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Jamie",
  "Drew", "Reese", "Avery", "Quinn", "Rowan", "Blake", "Harper", "Kai",
  "Logan", "Micah", "Nico", "Oren", "Parker", "Remy", "Sage", "Toby",
  "Val", "Wren", "Ellis", "Finley", "Gray", "Hale", "Ira", "Jules",
  "Kit", "Lane", "Max", "Noor", "Otis", "Pax", "Quill", "Shea",
];
const LAST_NAMES = [
  "Burke", "Carter", "Doyle", "Ellison", "Farrow", "Grant", "Hale",
  "Irwin", "Jacks", "Keane", "Lowry", "Mercer", "Nolan", "Osei",
  "Pryor", "Quinn", "Rourke", "Sayer", "Tovar", "Underwood", "Vance",
  "Walsh", "Yarrow", "Zane", "Abara", "Bellamy", "Cresswell", "Dunmore",
  "Ekwueme", "Fenwick", "Gallo", "Hargrove", "Isham", "Jarrett",
  "Kowalski", "Larosa", "Mbeki", "Novak", "Ortega", "Pell",
];
const NATIONALITIES = [
  "England", "Scotland", "Wales", "Ireland", "France", "Spain",
  "Portugal", "Nigeria", "Ghana", "Brazil",
];
const OPPONENT_NAMES = [
  "Riverside Rovers", "Northgate United", "Castlefield Athletic",
  "Harbour City FC", "Eastwood Albion", "Summit Town", "Vale Rangers",
  "Ashbourne Wanderers",
];
const VENUE_NAMES = [
  "Meadowfield Park", "The Pinfold Ground", "Stonebridge Arena",
];

type Position = "gk" | "def" | "mid" | "fwd";

function positionForIndex(i: number): Position {
  if (i < 4) return "gk";
  if (i < 18) return "def";
  if (i < 32) return "mid";
  return "fwd";
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

async function truncateAll() {
  // Children first, respecting FKs. Base tables only — views have no
  // storage of their own. Each table's delete filters on a column that
  // is always NOT NULL on that table, since Supabase's client requires
  // a filter on `.delete()`.
  const tables: Array<[string, string]> = [
    ["rsvps", "id"],
    ["player_stat_lines", "match_id"],
    ["match_results", "match_id"],
    ["standings_snapshot", "id"],
    ["trainings", "id"],
    ["matches", "id"],
    ["player_consents", "player_id"],
    ["players", "id"],
    ["competitions", "id"],
    ["seasons", "id"],
    ["opponents", "id"],
    ["venues", "id"],
  ];
  for (const [table, column] of tables) {
    const { error } = await supabase.from(table).delete().not(column, "is", null);
    if (error) throw new Error(`truncate ${table}: ${error.message}`);
  }

  // Remove any previously seeded auth users (idempotent reseed).
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw new Error(`list auth users: ${listError.message}`);
  const seeded = userList.users.filter((u) => u.email?.endsWith(`@${EMAIL_DOMAIN}`));
  for (const user of seeded) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`delete auth user ${user.id}: ${error.message}`);
  }
}

async function seed() {
  await truncateAll();

  // ---- reference data ----
  const { data: season, error: seasonError } = await supabase
    .from("seasons")
    .insert({ name: "2025/26", is_current: true })
    .select()
    .single();
  if (seasonError) throw seasonError;

  const { data: league, error: leagueError } = await supabase
    .from("competitions")
    .insert({ season_id: season.id, name: "Riverside League", type: "league" })
    .select()
    .single();
  if (leagueError) throw leagueError;

  const { data: friendly, error: friendlyError } = await supabase
    .from("competitions")
    .insert({ season_id: season.id, name: "Preseason Friendlies", type: "friendly" })
    .select()
    .single();
  if (friendlyError) throw friendlyError;

  const { data: opponents, error: opponentsError } = await supabase
    .from("opponents")
    .insert(OPPONENT_NAMES.map((name) => ({ name, crest_url: null })))
    .select();
  if (opponentsError) throw opponentsError;

  const { data: venues, error: venuesError } = await supabase
    .from("venues")
    .insert(VENUE_NAMES.map((name) => ({ name, address: `1 ${name} Road` })))
    .select();
  if (venuesError) throw venuesError;

  // ---- players (40 active + 1 archived) ----
  type SeedPlayer = {
    fullName: string;
    squadNumber: number;
    position: Position;
    dob: string;
    email: string;
    phone: string;
    nationality: string;
    isMinor: boolean;
    guardianConsent: boolean;
    isArchived: boolean;
    consents: { photo: boolean; nationality: boolean; stats: boolean };
  };

  const activePlayers: SeedPlayer[] = [];
  for (let i = 0; i < 40; i++) {
    const fullName = `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 7)}`;
    const isMinor = i === 0 || i === 1;
    // Player 0: minor, guardian consent given, opted into everything.
    // Player 1: minor, NO guardian consent, but has flipped some of
    // their own consent flags on — the public_profile view and
    // visiblePlayerFields() must hide those fields anyway (AC-4.2.2).
    const guardianConsent = i === 0;
    const consents =
      i === 0
        ? { photo: true, nationality: true, stats: true }
        : i === 1
        ? { photo: true, nationality: true, stats: false }
        : { photo: i % 2 === 0, nationality: i % 3 !== 0, stats: i % 4 !== 0 };

    activePlayers.push({
      fullName,
      squadNumber: i + 1,
      position: positionForIndex(i),
      dob: isMinor ? `${2010 - (i % 2)}-05-14` : `${1988 + (i % 15)}-0${(i % 9) + 1}-1${(i % 8) + 1}`,
      email: `p${String(i + 1).padStart(2, "0")}@${EMAIL_DOMAIN}`,
      phone: `+1-555-01${String(i + 1).padStart(2, "0")}`,
      nationality: pick(NATIONALITIES, i),
      isMinor,
      guardianConsent,
      isArchived: false,
      consents,
    });
  }

  const archivedPlayer: SeedPlayer = {
    fullName: "Casey Retired",
    squadNumber: 99,
    position: "mid",
    dob: "1992-02-02",
    email: `archived@${EMAIL_DOMAIN}`,
    phone: "+1-555-0199",
    nationality: "England",
    isMinor: false,
    guardianConsent: false,
    isArchived: true,
    consents: { photo: false, nationality: false, stats: false },
  };

  const allPlayers = [...activePlayers, archivedPlayer];
  const createdPlayerIds: string[] = [];
  const createdAuthIds: (string | null)[] = [];

  for (const player of allPlayers) {
    let authUserId: string | null = null;
    if (!player.isArchived) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: player.email,
        password: FAKE_PASSWORD,
        email_confirm: true,
      });
      if (authError) throw new Error(`create auth user ${player.email}: ${authError.message}`);
      authUserId = authUser.user.id;
    }

    const { data: row, error: insertError } = await supabase
      .from("players")
      .insert({
        auth_user_id: authUserId,
        full_name: player.fullName,
        squad_number: player.squadNumber,
        position: player.position,
        dob: player.dob,
        email: player.email,
        phone: player.phone,
        nationality: player.nationality,
        photo_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(player.fullName)}`,
        is_archived: player.isArchived,
        is_minor: player.isMinor,
        guardian_consent: player.guardianConsent,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    const { error: consentError } = await supabase.from("player_consents").insert({
      player_id: row.id,
      photo_consent: player.consents.photo,
      nationality_consent: player.consents.nationality,
      stats_consent: player.consents.stats,
    });
    if (consentError) throw consentError;

    createdPlayerIds.push(row.id);
    createdAuthIds.push(authUserId);
  }

  // ---- past matches + results ----
  const pastLeagueMatches = [
    { daysAgo: 28, opp: 0, home: 2, away: 1, published: true },
    { daysAgo: 21, opp: 1, home: 0, away: 0, published: true },
    { daysAgo: 14, opp: 2, home: 3, away: 2, published: true },
    { daysAgo: 7, opp: 3, home: 1, away: 1, published: true },
    { daysAgo: 3, opp: 4, home: 2, away: 0, published: false }, // AC-2.2.2
  ];

  for (const m of pastLeagueMatches) {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        competition_id: league.id,
        opponent_id: opponents[m.opp].id,
        venue_id: venues[m.opp % venues.length].id,
        kickoff_at: daysAgo(m.daysAgo),
        status: "completed",
      })
      .select()
      .single();
    if (matchError) throw matchError;

    const { error: resultError } = await supabase.from("match_results").insert({
      match_id: match.id,
      home_score: m.home,
      away_score: m.away,
      is_published: m.published,
    });
    if (resultError) throw resultError;
  }

  const { data: friendlyMatch, error: friendlyMatchError } = await supabase
    .from("matches")
    .insert({
      competition_id: friendly.id,
      opponent_id: opponents[5].id,
      venue_id: venues[0].id,
      kickoff_at: daysAgo(35),
      status: "completed",
    })
    .select()
    .single();
  if (friendlyMatchError) throw friendlyMatchError;

  const { error: friendlyResultError } = await supabase.from("match_results").insert({
    match_id: friendlyMatch.id,
    home_score: 4,
    away_score: 1,
    is_published: true,
  });
  if (friendlyResultError) throw friendlyResultError;

  // ---- upcoming matches ----
  const { error: cancelledError } = await supabase
    .from("matches")
    .insert({
      competition_id: league.id,
      opponent_id: opponents[6].id,
      venue_id: venues[1].id,
      kickoff_at: hoursFromNow(30),
      status: "cancelled",
    })
    .select()
    .single();
  if (cancelledError) throw cancelledError;

  // Class demo match: rsvp_cutoff_at (kickoff - 2h, the trigger's D8
  // default) must land 2h from seed-run time (D9), so kickoff is 4h out.
  const { data: demoMatch, error: demoError } = await supabase
    .from("matches")
    .insert({
      competition_id: league.id,
      opponent_id: opponents[7].id,
      venue_id: venues[2].id,
      kickoff_at: hoursFromNow(4),
      status: "scheduled",
    })
    .select()
    .single();
  if (demoError) throw demoError;

  const { error: laterError } = await supabase.from("matches").insert({
    competition_id: league.id,
    opponent_id: opponents[0].id,
    venue_id: venues[0].id,
    kickoff_at: hoursFromNow(24 * 10),
    status: "scheduled",
  });
  if (laterError) throw laterError;

  // ---- trainings (seeded, unused by any in-scope screen — D6) ----
  const { error: trainingsError } = await supabase.from("trainings").insert([
    { starts_at: hoursFromNow(48), location: venues[0].name },
    { starts_at: hoursFromNow(96), location: venues[0].name },
  ]);
  if (trainingsError) throw trainingsError;

  // ---- standings snapshot (static, no sync logic — out of scope) ----
  const standingsRows = OPPONENT_NAMES.slice(0, 7).map((name, i) => ({
    competition_id: league.id,
    position: i + 2,
    team_name: name,
    played: 5,
    won: 4 - (i % 5),
    drawn: 1,
    lost: i % 5,
    points: (4 - (i % 5)) * 3 + 1,
    is_pintfc: false,
  }));
  standingsRows.splice(2, 0, {
    competition_id: league.id,
    position: 3,
    team_name: "PINT FC",
    played: 5,
    won: 3,
    drawn: 1,
    lost: 1,
    points: 10,
    is_pintfc: true,
  });
  standingsRows.forEach((row, i) => (row.position = i + 1));

  const { error: standingsError } = await supabase.from("standings_snapshot").insert(standingsRows);
  if (standingsError) throw standingsError;

  // ---- a few RSVPs for the class demo match, for realistic counts ----
  const rsvpAnswers: Array<"going" | "maybe" | "not_going"> = ["going", "going", "going", "maybe", "not_going"];
  const rsvpRows = createdPlayerIds.slice(2, 2 + rsvpAnswers.length).map((playerId, i) => ({
    match_id: demoMatch.id,
    player_id: playerId,
    answer: rsvpAnswers[i],
  }));
  const { error: rsvpError } = await supabase.from("rsvps").insert(rsvpRows);
  if (rsvpError) throw rsvpError;

  // ---- write fake logins to a gitignored file only ----
  const loginLines = allPlayers
    .filter((p) => !p.isArchived)
    .map((p) => `${p.email}  ${FAKE_PASSWORD}  (${p.fullName})`)
    .join("\n");
  writeFileSync(
    "seed-logins.md",
    `# Seeded fake player logins (do not commit)\n\nAll players share one fake password.\n\n${loginLines}\n`
  );

  console.log("Seed complete: 40 active players + 1 archived, 1 season, 2 competitions,");
  console.log(`5 past league results (4 published, 1 unpublished), 1 friendly result,`);
  console.log("1 cancelled upcoming match, 1 class-demo match, 1 later scheduled match,");
  console.log("2 trainings, 1 standings snapshot, 5 RSVPs. Logins written to seed-logins.md.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
