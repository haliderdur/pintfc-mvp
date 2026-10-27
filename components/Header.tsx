import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { HeaderAuthControls } from "./HeaderAuthControls";
import { Button } from "@/components/ui/button";

export async function Header() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  const player = data.user
    ? (
        await supabase
          .from("players")
          .select("full_name")
          .eq("auth_user_id", data.user.id)
          .single()
      ).data
    : null;

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          PINT FC
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1">
          <Button variant="ghost" size="sm" render={<Link href="/squad">Squad</Link>} />
          {data.user ? (
            <HeaderAuthControls fullName={player?.full_name ?? ""} />
          ) : (
            <Button
              variant="default"
              size="sm"
              render={
                <Link data-testid="header-signin" href="/sign-in">
                  Sign in
                </Link>
              }
            />
          )}
        </nav>
      </div>
    </header>
  );
}
