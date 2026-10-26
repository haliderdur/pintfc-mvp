import type { SupabaseClient } from "@supabase/supabase-js";
import { visiblePlayerFields } from "../rules/visibility";

export type PlayerPosition = "gk" | "def" | "mid" | "fwd";

export interface PlayerProfile {
  id: string;
  fullName: string;
  squadNumber: number;
  position: PlayerPosition;
  photoUrl: string | null;
  nationality: string | null;
  statsVisible: boolean;
}

// Self-view and public-view share this one function (session-04 plan,
// task 3). `public_profile` already applies the consent/guardian rule
// for everyone; when the caller is viewing their own row, this re-reads
// the raw `players` row (allowed only for the caller's own row by the
// `players_self_select` RLS policy) and runs it through
// `visiblePlayerFields`'s `viewerIsSelf` branch instead, per AC-4.3.3.
// `viewerAuthUserId` only ever narrows to "is this the caller's own
// profile" — it never widens what anyone else's view returns.
export async function getPlayerProfile(
  supabase: SupabaseClient,
  playerId: string,
  viewerAuthUserId: string | null
): Promise<PlayerProfile | null> {
  const { data: profile, error } = await supabase
    .from("public_profile")
    .select("id, full_name, squad_number, position, nationality, photo_url, stats_visible")
    .eq("id", playerId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  let nationality: string | null = profile.nationality;
  let photoUrl: string | null = profile.photo_url;
  let statsVisible: boolean = profile.stats_visible;

  if (viewerAuthUserId) {
    const { data: own } = await supabase
      .from("players")
      .select("id, nationality, photo_url")
      .eq("auth_user_id", viewerAuthUserId)
      .maybeSingle();

    if (own && own.id === playerId) {
      // The player/consent args are irrelevant here — viewerIsSelf=true
      // short-circuits to "everything visible" regardless of them.
      const visible = visiblePlayerFields(
        { isMinor: false, guardianConsent: false, isArchived: false },
        { photoConsent: false, nationalityConsent: false, statsConsent: false },
        true
      );
      nationality = visible.nationality ? own.nationality : null;
      photoUrl = visible.photoUrl ? own.photo_url : null;
      statsVisible = visible.statsVisible;
    }
  }

  return {
    id: profile.id,
    fullName: profile.full_name,
    squadNumber: profile.squad_number,
    position: profile.position,
    photoUrl,
    nationality,
    statsVisible,
  };
}
