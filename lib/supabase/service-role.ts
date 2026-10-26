import { createClient } from "@supabase/supabase-js";

// Service-role client: full DB access, bypasses RLS. Only ever imported
// by scripts/seed.ts (run locally/CI with the key from an untracked
// .env.local or CI secret) — never by anything under app/ or components/
// that ships to the browser (threats.md T9).
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
