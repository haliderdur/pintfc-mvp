import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextMatchCountdown } from "@/components/NextMatchCountdown";
import { computeSeasonRecord } from "@/lib/season-record";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    // opponent_id/venue_id are single FKs on `matches`, so PostgREST embeds
    // each as one object, not an array — supabase-js can't infer that
    // cardinality from an untyped client, so it's declared explicitly here.
    .returns<
      Array<{
        id: string;
        kickoff_at: string;
        status: "scheduled" | "cancelled";
        opponents: { name: string } | null;
        venues: { name: string } | null;
      }>
    >()
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    kickoffAt: data.kickoff_at,
    status: data.status,
    opponentName: data.opponents?.name ?? "",
    venueName: data.venues?.name ?? "",
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
    .in("id", matchIds)
    // See getNextMatch's comment: these are single-FK embeds, each one object.
    .returns<
      Array<{
        id: string;
        kickoff_at: string;
        opponents: { name: string } | null;
        competitions: { type: "league" | "friendly" } | null;
      }>
    >();
  if (matchesError) throw matchesError;

  const matchById = new Map((matches ?? []).map((m) => [m.id, m]));

  return results
    .map((r) => {
      const match = matchById.get(r.match_id);
      if (!match) return null;
      return {
        matchId: r.match_id,
        kickoffAt: match.kickoff_at,
        opponentName: match.opponents?.name ?? "",
        competitionType: match.competitions?.type ?? "league",
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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Next match</CardTitle>
        </CardHeader>
        <CardContent>
          {nextMatch ? (
            <div data-testid="home-next-match" className="flex flex-col gap-1">
              <p className="text-lg font-medium">{nextMatch.opponentName}</p>
              <p className="text-sm text-muted-foreground">{nextMatch.venueName}</p>
              <p className="text-sm text-muted-foreground">{formatKickoff(nextMatch.kickoffAt)}</p>
              {nextMatch.status === "cancelled" ? (
                <Badge data-testid="home-next-match-cancelled" variant="destructive" className="mt-1 w-fit">
                  Cancelled
                </Badge>
              ) : (
                <div className="mt-1">
                  <NextMatchCountdown kickoffAt={nextMatch.kickoffAt} />
                </div>
              )}
            </div>
          ) : (
            <p data-testid="home-next-match-empty" className="text-muted-foreground">
              No upcoming match scheduled.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Season record</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="home-record" className="text-lg font-semibold">
            {record.wins}W {record.draws}D {record.losses}L
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest results</CardTitle>
        </CardHeader>
        <CardContent>
          {latestResults.length > 0 ? (
            <ul data-testid="home-results-list" className="flex flex-col gap-2">
              {latestResults.map((r) => (
                <li key={r.matchId} className="flex items-center justify-between gap-2 text-sm">
                  <span>{r.opponentName}</span>
                  <span className="font-mono font-medium">
                    {r.homeScore}-{r.awayScore}
                  </span>
                  <Badge variant="outline">{r.competitionType}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p data-testid="home-results-empty" className="text-muted-foreground">
              No published results yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mini league table</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table data-testid="home-league-table" className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1 pr-2 font-medium">Pos</th>
                <th className="py-1 pr-2 font-medium">Team</th>
                <th className="py-1 pr-2 font-medium">Played</th>
                <th className="py-1 font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b last:border-0 ${row.isPintFc ? `${styles.pintFcRow} bg-muted/50` : ""}`}
                >
                  <td className="py-1.5 pr-2">{row.position}</td>
                  <td className="py-1.5 pr-2">{row.teamName}</td>
                  <td className="py-1.5 pr-2">{row.played}</td>
                  <td className="py-1.5">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Squad</CardTitle>
        </CardHeader>
        <CardContent aria-label="Squad teaser" data-testid="home-squad-teaser" className="flex flex-col gap-3">
          <ul className="flex flex-col gap-1">
            {squad.map((player) => (
              <li key={player.id} className="text-sm">
                {player.fullName} #{player.squadNumber}
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="w-fit" render={<Link href="/squad">See full squad</Link>} />
        </CardContent>
      </Card>
    </main>
  );
}
