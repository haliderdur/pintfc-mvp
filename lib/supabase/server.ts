import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Component / Route Handler client: reads the player's session
// from httpOnly cookies set by @supabase/ssr, so Server Components and
// Route Handlers see the same RLS-governed view a real player would
// (architecture.md "How sign-in works").
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render, where cookies are
          // read-only; middleware.ts is what actually refreshes the
          // session cookie on navigations.
        }
      },
    },
  });
}
