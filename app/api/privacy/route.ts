import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/error-response";
import { canEditOwnConsent } from "@/lib/rules/visibility";

const FIELD_TO_COLUMN = {
  photoConsent: "photo_consent",
  nationalityConsent: "nationality_consent",
  statsConsent: "stats_consent",
} as const;
type Field = keyof typeof FIELD_TO_COLUMN;
const VALID_FIELDS = Object.keys(FIELD_TO_COLUMN) as Field[];

function isValidBody(body: unknown): body is Partial<Record<Field, boolean>> {
  if (typeof body !== "object" || body === null) return false;
  const entries = Object.entries(body as Record<string, unknown>);
  if (entries.length === 0) return false;
  return entries.every(
    ([key, value]) => VALID_FIELDS.includes(key as Field) && typeof value === "boolean"
  );
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return errorResponse("UNAUTHENTICATED", "Sign in to update privacy settings.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return errorResponse("VALIDATION_ERROR", "Unknown field or wrong type.", 400);
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, is_minor, guardian_consent")
    .eq("auth_user_id", userData.user.id)
    .single();
  if (playerError || !player) {
    return errorResponse("UNAUTHENTICATED", "Sign in to update privacy settings.", 401);
  }

  const turningAnyOn = Object.values(body).some((value) => value === true);
  if (
    turningAnyOn &&
    !canEditOwnConsent(
      { isMinor: player.is_minor, guardianConsent: player.guardian_consent, isArchived: false },
      true
    )
  ) {
    return errorResponse(
      "FORBIDDEN_MINOR_CONSENT",
      "A minor without guardian consent cannot enable this field.",
      403
    );
  }

  const update: Record<string, boolean> = {};
  for (const [field, value] of Object.entries(body)) {
    update[FIELD_TO_COLUMN[field as Field]] = value as boolean;
  }

  const { data: consents, error: updateError } = await supabase
    .from("player_consents")
    .update(update)
    .eq("player_id", player.id)
    .select("photo_consent, nationality_consent, stats_consent")
    .single();
  if (updateError || !consents) {
    return errorResponse(
      "FORBIDDEN_MINOR_CONSENT",
      "A minor without guardian consent cannot enable this field.",
      403
    );
  }

  return NextResponse.json({
    photoConsent: consents.photo_consent,
    nationalityConsent: consents.nationality_consent,
    statsConsent: consents.stats_consent,
  });
}
