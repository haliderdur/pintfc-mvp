import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  // Supabase's global sign-out revokes every refresh token for this
  // user server-side — not just this device's cookie (AC-1.6.2/1.6.3,
  // threats.md T5).
  await supabase.auth.signOut({ scope: "global" });
  return new Response(null, { status: 204 });
}
