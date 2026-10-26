import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPlayerProfile } from "@/lib/profile/get-profile";

const POSITION_LABELS: Record<string, string> = {
  gk: "Goalkeeper",
  def: "Defender",
  mid: "Midfielder",
  fwd: "Forward",
};

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  const profile = await getPlayerProfile(supabase, id, userData.user?.id ?? null);
  if (!profile) {
    notFound();
  }

  return (
    <main>
      <h1 data-testid="profile-name">{profile.fullName}</h1>
      <p data-testid="profile-number">#{profile.squadNumber}</p>
      <p data-testid="profile-position">{POSITION_LABELS[profile.position]}</p>
      {profile.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img data-testid="profile-field-photo" src={profile.photoUrl} alt={`${profile.fullName}'s photo`} />
      )}
      {profile.nationality && <p data-testid="profile-field-nationality">{profile.nationality}</p>}
      {profile.statsVisible && <p data-testid="profile-field-stats">Stats visible</p>}
    </main>
  );
}
