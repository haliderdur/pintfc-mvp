import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PlayerPosition } from "@/lib/profile/get-profile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SquadPlayer = {
  id: string;
  fullName: string;
  squadNumber: number;
  position: PlayerPosition;
};

const POSITION_ORDER: PlayerPosition[] = ["gk", "def", "mid", "fwd"];
const POSITION_LABELS: Record<PlayerPosition, string> = {
  gk: "Goalkeepers",
  def: "Defenders",
  mid: "Midfielders",
  fwd: "Forwards",
};

async function getSquad(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<SquadPlayer[]> {
  const { data, error } = await supabase
    .from("public_players")
    .select("id, full_name, squad_number, position")
    .order("squad_number", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    squadNumber: row.squad_number,
    position: row.position,
  }));
}

export default async function SquadPage() {
  const supabase = await createServerSupabaseClient();
  const players = await getSquad(supabase);

  if (players.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <p data-testid="squad-empty" className="text-muted-foreground">
          No players yet.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Squad</h1>
      {POSITION_ORDER.map((position) => {
        const group = players.filter((p) => p.position === position);
        if (group.length === 0) return null;

        return (
          <section key={position} aria-label={POSITION_LABELS[position]} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {POSITION_LABELS[position]}
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {group.map((player) => (
                <Link
                  key={player.id}
                  data-testid={`squad-player-${player.id}`}
                  href={`/players/${player.id}`}
                  className="block"
                >
                  <Card className="flex-row items-center gap-3 px-4 py-3 transition-colors hover:bg-muted">
                    <Badge variant="secondary" className="shrink-0 font-mono">
                      #{player.squadNumber}
                    </Badge>
                    <span className="font-medium">{player.fullName}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
