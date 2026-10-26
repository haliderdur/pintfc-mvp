import { createClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "../../lib/supabase/service-role";
import { SEED_FAKE_PASSWORD, seedPlayerEmail } from "../../lib/seed-constants";

export function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
}

export const serviceClient = createServiceRoleClient();

// Signs in as the Nth seeded player (1-indexed, matching scripts/seed.ts's
// p01@pintfc.test..p40@pintfc.test) and returns a client carrying that
// player's session — used to exercise RLS policies as a real player JWT,
// per docs/design/threats.md.
export async function signInAsSeedPlayer(oneIndexed: number) {
  const client = createAnonClient();
  const { error } = await client.auth.signInWithPassword({
    email: seedPlayerEmail(oneIndexed),
    password: SEED_FAKE_PASSWORD,
  });
  if (error) throw new Error(`sign in as player ${oneIndexed}: ${error.message}`);
  return client;
}
