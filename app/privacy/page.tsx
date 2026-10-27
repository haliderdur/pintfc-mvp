import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PrivacyForm } from "./PrivacyForm";

export default async function PrivacyPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/sign-in");
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, is_minor, guardian_consent")
    .eq("auth_user_id", userData.user.id)
    .single();
  if (playerError || !player) throw playerError ?? new Error("player not found");

  const { data: consents, error: consentsError } = await supabase
    .from("player_consents")
    .select("photo_consent, nationality_consent, stats_consent")
    .eq("player_id", player.id)
    .single();
  if (consentsError || !consents) throw consentsError ?? new Error("consents not found");

  const locked = player.is_minor && !player.guardian_consent;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy settings</h1>
      <PrivacyForm
        locked={locked}
        initialConsents={{
          photoConsent: consents.photo_consent,
          nationalityConsent: consents.nationality_consent,
          statsConsent: consents.stats_consent,
        }}
      />
    </main>
  );
}
