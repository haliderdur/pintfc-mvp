import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PlayerPosition } from "@/lib/profile/get-profile";

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
      <main>
        <p data-testid="squad-empty">No players yet.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Squad</h1>
      {POSITION_ORDER.map((position) => {
        const group = players.filter((p) => p.position === position);
        if (group.length === 0) return null;

        return (
          <section key={position} aria-label={POSITION_LABELS[position]}>
            <h2>{POSITION_LABELS[position]}</h2>
            <ul>
              {group.map((player) => (
                <li key={player.id}>
                  <Link data-testid={`squad-player-${player.id}`} href={`/players/${player.id}`}>
                    {player.fullName} #{player.squadNumber}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
