import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextMatchCountdown } from "@/components/NextMatchCountdown";
import { computeSeasonRecord } from "@/lib/season-record";
import styles from "./page.module.css";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type NextMatch = {
  id: string;
  kickoffAt: string;
  status: "scheduled" | "cancelled";
  opponentName: string;
  venueName: string;
};

type LatestResult = {
  matchId: string;
  kickoffAt: string;
  opponentName: string;
  competitionType: "league" | "friendly";
  homeScore: number;
  awayScore: number;
};

type StandingsRow = {
  id: string;
  position: number;
  teamName: string;
  played: number;
  points: number;
  isPintFc: boolean;
};

type SquadTeaserPlayer = {
  id: string;
  fullName: string;
  squadNumber: number;
  position: string;
};

async function getNextMatch(supabase: SupabaseServerClient): Promise<NextMatch | null> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, kickoff_at, status, opponents(name), venues(name)")
    .in("status", ["scheduled", "cancelled"])
    .gte("kickoff_at", new Date().toISOString())
    .order("kickoff_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    kickoffAt: data.kickoff_at,
    status: data.status,
    opponentName: data.opponents?.[0]?.name ?? "",
    venueName: data.venues?.[0]?.name ?? "",
  };
}

// The schema has no home/away flag on `matches` — the seed data always
// records PINT FC's own goals as `home_score` regardless of the actual
// venue, so PINT FC is treated as "home" for every result (DECISIONS.md
// has no entry yet for this; flagging it in the session report).
async function getLatestResults(supabase: SupabaseServerClient): Promise<LatestResult[]> {
  const { data: results, error: resultsError } = await supabase
    .from("public_match_results")
    .select("match_id, home_score, away_score");
  if (resultsError) throw resultsError;
  if (!results || results.length === 0) return [];

  const matchIds = results.map((r) => r.match_id);
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, kickoff_at, opponents(name), competitions(type)")
    .in("id", matchIds);
  if (matchesError) throw matchesError;

  const matchById = new Map((matches ?? []).map((m) => [m.id, m]));

  return results
    .map((r) => {
      const match = matchById.get(r.match_id);
      if (!match) return null;
      return {
        matchId: r.match_id,
        kickoffAt: match.kickoff_at,
        opponentName: match.opponents?.[0]?.name ?? "",
        competitionType: match.competitions?.[0]?.type ?? "league",
        homeScore: r.home_score,
        awayScore: r.away_score,
      };
    })
    .filter((r): r is LatestResult => r !== null)
    .sort((a, b) => new Date(b.kickoffAt).getTime() - new Date(a.kickoffAt).getTime());
}

async function getStandings(supabase: SupabaseServerClient): Promise<StandingsRow[]> {
  const { data, error } = await supabase
    .from("standings_snapshot")
    .select("id, position, team_name, played, points, is_pintfc")
    .order("position", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    position: row.position,
    teamName: row.team_name,
    played: row.played,
    points: row.points,
    isPintFc: row.is_pintfc,
  }));
}

async function getSquadTeaser(supabase: SupabaseServerClient): Promise<SquadTeaserPlayer[]> {
  const { data, error } = await supabase
    .from("public_players")
    .select("id, full_name, squad_number, position")
    .order("squad_number", { ascending: true })
    .limit(6);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    squadNumber: row.squad_number,
    position: row.position,
  }));
}

function formatKickoff(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function Home() {
  const supabase = await createServerSupabaseClient();

  const [nextMatch, latestResults, standings, squad] = await Promise.all([
    getNextMatch(supabase),
    getLatestResults(supabase),
    getStandings(supabase),
    getSquadTeaser(supabase),
  ]);

  const record = computeSeasonRecord(
    latestResults.map((r) => ({ homeScore: r.homeScore, awayScore: r.awayScore, isPintFcHome: true })),
  );

  return (
    <main className={styles.page}>
      <section aria-label="Next match">
        {nextMatch ? (
          <div data-testid="home-next-match">
            <p>{nextMatch.opponentName}</p>
            <p>{nextMatch.venueName}</p>
            <p>{formatKickoff(nextMatch.kickoffAt)}</p>
            {nextMatch.status === "cancelled" ? (
              <span data-testid="home-next-match-cancelled">Cancelled</span>
            ) : (
              <NextMatchCountdown kickoffAt={nextMatch.kickoffAt} />
            )}
          </div>
        ) : (
          <p data-testid="home-next-match-empty">No upcoming match scheduled.</p>
        )}
      </section>

      <section aria-label="Season record">
        <div data-testid="home-record">
          {record.wins}W {record.draws}D {record.losses}L
        </div>
      </section>

      <section aria-label="Latest results">
        {latestResults.length > 0 ? (
          <ul data-testid="home-results-list">
            {latestResults.map((r) => (
              <li key={r.matchId}>
                <span>{r.opponentName}</span>
                <span>
                  {r.homeScore}-{r.awayScore}
                </span>
                <span>{r.competitionType}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p data-testid="home-results-empty">No published results yet.</p>
        )}
      </section>

      <section aria-label="Mini league table">
        <table data-testid="home-league-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Team</th>
              <th>Played</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr key={row.id} className={row.isPintFc ? styles.pintFcRow : undefined}>
                <td>{row.position}</td>
                <td>{row.teamName}</td>
                <td>{row.played}</td>
                <td>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-label="Squad teaser" data-testid="home-squad-teaser">
        <ul>
          {squad.map((player) => (
            <li key={player.id}>
              {player.fullName} #{player.squadNumber}
            </li>
          ))}
        </ul>
        <Link href="/squad">See full squad</Link>
      </section>
    </main>
  );
}
