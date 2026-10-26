import type { SupabaseClient } from "@supabase/supabase-js";
import { isRsvpOpen } from "@/lib/rules/cutoff";

export type RsvpAnswer = "going" | "maybe" | "not_going";

export interface FixtureRosterEntry {
  playerId: string;
  fullName: string;
  answer: RsvpAnswer;
}

export interface FixtureSummary {
  going: number;
  maybe: number;
  notGoing: number;
  cutoffAt: string;
  isOpen: boolean;
  roster: FixtureRosterEntry[] | null;
}

// Shared by the summary Route Handler and the fixture page's Server
// Component (api.md: the page's initial render is "same shape as the
// summary endpoint"). `includeRoster` is false for a signed-out caller —
// `player_rsvp_roster` isn't granted to `anon` anyway, but we avoid the
// query entirely rather than rely on that grant alone.
export async function getFixtureSummary(
  supabase: SupabaseClient,
  matchId: string,
  includeRoster: boolean
): Promise<FixtureSummary | null> {
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, rsvp_cutoff_at")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return null;
  }

  const { data: counts } = await supabase
    .from("public_rsvp_counts")
    .select("going, maybe, not_going")
    .eq("match_id", matchId)
    .maybeSingle();

  let roster: FixtureRosterEntry[] | null = null;
  if (includeRoster) {
    const { data: rosterRows } = await supabase
      .from("player_rsvp_roster")
      .select("player_id, full_name, answer")
      .eq("match_id", matchId);

    roster = (rosterRows ?? []).map((row) => ({
      playerId: row.player_id,
      fullName: row.full_name,
      answer: row.answer,
    }));
  }

  return {
    going: counts?.going ?? 0,
    maybe: counts?.maybe ?? 0,
    notGoing: counts?.not_going ?? 0,
    cutoffAt: match.rsvp_cutoff_at,
    isOpen: isRsvpOpen({ rsvpCutoffAt: match.rsvp_cutoff_at }),
    roster,
  };
}
