import { describe, expect, it } from "vitest";
import { createAnonClient, serviceClient } from "./helpers";

describe("AC-4.1.2 the archived player is excluded from the public players view", () => {
  it("public_players never includes the seeded archived player", async () => {
    const client = createAnonClient();
    const { data, error } = await client.from("public_players").select("full_name");
    expect(error).toBeNull();
    expect(data).toHaveLength(40);
    expect(data!.some((row) => row.full_name === "Casey Retired")).toBe(false);
  });
});

describe("AC-2.4.2 the archived player never appears in the squad-teaser's underlying read", () => {
  it("the same public_players view the home squad teaser reads from excludes the archived player", async () => {
    // Session 03 reads the home squad teaser from this exact view — one
    // shared query, not a second filter that could drift (rules.md §3).
    const client = createAnonClient();
    const { data, error } = await client.from("public_players").select("id").limit(5);
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);

    const { data: archived } = await serviceClient.from("players").select("id").eq("is_archived", true).single();
    expect(data!.some((row) => row.id === archived!.id)).toBe(false);
  });
});

describe("AC-4.2.2 a minor player's opt-in fields are hidden when guardian consent is false, regardless of their own consent flags", () => {
  it("public_profile hides nationality/photo/stats for the unconsented minor even though their own flags are true", async () => {
    const { data: minor, error: minorError } = await serviceClient
      .from("players")
      .select("id, is_minor, guardian_consent")
      .eq("email", "p02@pintfc.test")
      .single();
    if (minorError) throw minorError;
    expect(minor.is_minor).toBe(true);
    expect(minor.guardian_consent).toBe(false);

    const { data: consents } = await serviceClient
      .from("player_consents")
      .select("photo_consent, nationality_consent")
      .eq("player_id", minor.id)
      .single();
    // seed deliberately sets these true despite no guardian consent
    expect(consents!.photo_consent).toBe(true);
    expect(consents!.nationality_consent).toBe(true);

    const client = createAnonClient();
    const { data: profile, error } = await client.from("public_profile").select("*").eq("id", minor.id).single();
    expect(error).toBeNull();
    expect(profile!.nationality).toBeNull();
    expect(profile!.photo_url).toBeNull();
    expect(profile!.stats_visible).toBe(false);
  });

  it("public_profile still shows opt-in fields for the guardian-consented minor who opted in", async () => {
    const { data: consentedMinor, error } = await serviceClient
      .from("players")
      .select("id")
      .eq("email", "p01@pintfc.test")
      .single();
    if (error) throw error;

    const client = createAnonClient();
    const { data: profile } = await client.from("public_profile").select("*").eq("id", consentedMinor.id).single();
    expect(profile!.nationality).not.toBeNull();
    expect(profile!.photo_url).not.toBeNull();
    expect(profile!.stats_visible).toBe(true);
  });
});
