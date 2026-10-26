import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getFixtureSummary } from "@/lib/fixtures/get-summary";
import { FixtureRsvpPanel } from "./FixtureRsvpPanel";

export default async function FixturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = !!userData.user;

  const summary = await getFixtureSummary(supabase, id, isSignedIn);
  if (!summary) {
    notFound();
  }

  return (
    <main>
      <h1>Fixture</h1>
      <FixtureRsvpPanel matchId={id} isSignedIn={isSignedIn} initialSummary={summary} />
    </main>
  );
}
