import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/error-response";
import { getFixtureSummary } from "@/lib/fixtures/get-summary";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  const summary = await getFixtureSummary(supabase, id, !!userData.user);
  if (!summary) {
    return errorResponse("NOT_FOUND", "Fixture not found.", 404);
  }

  return NextResponse.json(summary);
}
