import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HeaderAuthControls } from "./HeaderAuthControls";

export async function Header() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return (
      <header>
        <Link data-testid="header-signin" href="/sign-in">
          Sign in
        </Link>
      </header>
    );
  }

  const { data: player } = await supabase
    .from("players")
    .select("full_name")
    .eq("auth_user_id", data.user.id)
    .single();

  return (
    <header>
      <HeaderAuthControls fullName={player?.full_name ?? ""} />
    </header>
  );
}
