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
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Fixture</h1>
      <FixtureRsvpPanel matchId={id} isSignedIn={isSignedIn} initialSummary={summary} />
    </main>
  );
}
