import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/error-response";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return errorResponse("VALIDATION_ERROR", "email and password are required.", 400);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  // Generic message for any failure — no "no such user" vs "wrong
  // password" distinction (AC-1.1.3).
  if (error || !data.user) {
    return errorResponse("INVALID_CREDENTIALS", "Incorrect email or password.", 401);
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, full_name")
    .eq("auth_user_id", data.user.id)
    .single();

  if (playerError || !player) {
    return errorResponse("INVALID_CREDENTIALS", "Incorrect email or password.", 401);
  }

  return NextResponse.json({ player: { id: player.id, fullName: player.full_name } });
}
