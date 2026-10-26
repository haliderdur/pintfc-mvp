import { describe, expect, it } from "vitest";
import { createAnonClient, serviceClient, signInAsSeedPlayer } from "./helpers";
import { getPlayerProfile } from "../../lib/profile/get-profile";

async function playerIdForEmail(email: string): Promise<string> {
  const { data, error } = await serviceClient.from("players").select("id").eq("email", email).single();
  if (error) throw error;
  return data.id;
}

describe("AC-4.2.1 a profile response omits every field the player has not consented to show", () => {
  it("public_profile omits photo/nationality for a player who hasn't consented to them, even though stats is on", async () => {
    // seed: index 3 (p04) -> photo: false, nationality: false, stats: true
    const id = await playerIdForEmail("p04@pintfc.test");
    const client = createAnonClient();
    const { data: profile, error } = await client.from("public_profile").select("*").eq("id", id).single();
    expect(error).toBeNull();
    expect(profile!.photo_url).toBeNull();
    expect(profile!.nationality).toBeNull();
    expect(profile!.stats_visible).toBe(true);
  });
});

describe("AC-4.3.1 no public API response for any player ever contains email, phone, date of birth or RSVP answer", () => {
  it("getPlayerProfile's response has none of those keys for any of the 40 active seeded players", async () => {
    const client = createAnonClient();
    const { data: players, error } = await serviceClient.from("public_players").select("id");
    expect(error).toBeNull();
    expect(players!.length).toBe(40);

    for (const { id } of players!) {
      const profile = await getPlayerProfile(client, id, null);
      expect(profile).not.toBeNull();
      const keys = Object.keys(profile!);
      expect(keys).not.toContain("email");
      expect(keys).not.toContain("phone");
      expect(keys).not.toContain("dob");
      expect(keys).not.toContain("answer");
    }
  });
});

describe("AC-4.3.3 a player viewing their own profile sees all of their own fields regardless of consent toggles", () => {
  it("shows nationality and photo for the owner even though their own consent flags are off", async () => {
    // seed: index 3 (p04) -> photo: false, nationality: false, stats: true
    const id = await playerIdForEmail("p04@pintfc.test");

    const publicClient = createAnonClient();
    const publicView = await getPlayerProfile(publicClient, id, null);
    expect(publicView!.photoUrl).toBeNull();
    expect(publicView!.nationality).toBeNull();

    const selfClient = await signInAsSeedPlayer(4);
    const { data: authData } = await selfClient.auth.getUser();
    const selfView = await getPlayerProfile(selfClient, id, authData.user!.id);
    expect(selfView!.photoUrl).not.toBeNull();
    expect(selfView!.nationality).not.toBeNull();
    expect(selfView!.statsVisible).toBe(true);
  });

  it("does not widen another player's profile just because the caller is signed in", async () => {
    // seed: index 4 (p05) -> stats: false, photo: true, nationality: true
    const otherId = await playerIdForEmail("p05@pintfc.test");

    const selfClient = await signInAsSeedPlayer(4); // signed in as p04, viewing p05
    const { data: authData } = await selfClient.auth.getUser();
    const view = await getPlayerProfile(selfClient, otherId, authData.user!.id);
    expect(view!.statsVisible).toBe(false);
  });
});
