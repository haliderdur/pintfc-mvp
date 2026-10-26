import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/error-response";
import { isRsvpOpen } from "@/lib/rules/cutoff";

const VALID_ANSWERS = ["going", "maybe", "not_going"] as const;
type Answer = (typeof VALID_ANSWERS)[number];

function isValidAnswer(value: unknown): value is Answer {
  return typeof value === "string" && (VALID_ANSWERS as readonly string[]).includes(value);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return errorResponse("UNAUTHENTICATED", "Sign in to RSVP.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !isValidAnswer(body.answer)) {
    return errorResponse("VALIDATION_ERROR", "answer must be one of going, maybe, not_going.", 400);
  }

  // Never trust a client-supplied player id — resolve the caller's own
  // player row from their session, same pattern as sign-in/route.ts.
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", userData.user.id)
    .single();
  if (playerError || !player) {
    return errorResponse("UNAUTHENTICATED", "Sign in to RSVP.", 401);
  }

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, rsvp_cutoff_at")
    .eq("id", id)
    .single();
  if (matchError || !match) {
    return errorResponse("NOT_FOUND", "Fixture not found.", 404);
  }

  // The RLS policy on `rsvps` is the real stop (data.md "Enforcement
  // strategy" #3); this check only exists for a clean error instead of a
  // raw Postgres error.
  if (!isRsvpOpen({ rsvpCutoffAt: match.rsvp_cutoff_at })) {
    return errorResponse("RSVP_CUTOFF_PASSED", "RSVP closed for this match.", 403);
  }

  const { data: rsvp, error: rsvpError } = await supabase
    .from("rsvps")
    .upsert({ match_id: id, player_id: player.id, answer: body.answer }, { onConflict: "match_id,player_id" })
    .select("answer, updated_at")
    .single();

  if (rsvpError || !rsvp) {
    return errorResponse("RSVP_CUTOFF_PASSED", "RSVP closed for this match.", 403);
  }

  return NextResponse.json({ answer: rsvp.answer, updatedAt: rsvp.updated_at });
}
