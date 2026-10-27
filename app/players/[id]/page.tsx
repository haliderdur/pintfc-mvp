import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPlayerProfile } from "@/lib/profile/get-profile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Card className="overflow-hidden">
        {profile.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-testid="profile-field-photo"
            src={profile.photoUrl}
            alt={`${profile.fullName}'s photo`}
            className="h-40 w-40 rounded-full object-cover mx-auto mt-6"
          />
        )}
        <CardContent className="flex flex-col items-center gap-2 text-center">
          <h1 data-testid="profile-name" className="text-2xl font-semibold tracking-tight">
            {profile.fullName}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono" data-testid="profile-number">
              #{profile.squadNumber}
            </Badge>
            <Badge data-testid="profile-position">{POSITION_LABELS[profile.position]}</Badge>
          </div>
          {profile.nationality && (
            <p data-testid="profile-field-nationality" className="text-muted-foreground">
              {profile.nationality}
            </p>
          )}
          {profile.statsVisible && (
            <p data-testid="profile-field-stats" className="text-sm text-muted-foreground">
              Stats visible
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
