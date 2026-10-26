import { describe, expect, it } from "vitest";
import { serviceClient, signInAsSeedPlayer } from "./helpers";

async function playerIdForEmail(email: string): Promise<string> {
  const { data, error } = await serviceClient.from("players").select("id").eq("email", email).single();
  if (error) throw error;
  return data.id;
}

describe("AC-3.3.4 an RSVP write is rejected by the database once the cutoff has passed", () => {
  it("rejects an insert for a completed (past-cutoff) match, even with the caller's own player id", async () => {
    const { data: pastMatch, error: matchError } = await serviceClient
      .from("matches")
      .select("id, rsvp_cutoff_at")
      .eq("status", "completed")
      .order("kickoff_at", { ascending: true })
      .limit(1)
      .single();
    if (matchError) throw matchError;
    expect(new Date(pastMatch.rsvp_cutoff_at).getTime()).toBeLessThan(Date.now());

    const client = await signInAsSeedPlayer(3);
    const ownId = await playerIdForEmail("p03@pintfc.test");

    const { data, error } = await client
      .from("rsvps")
      .insert({ match_id: pastMatch.id, player_id: ownId, answer: "going" })
      .select();

    expect(data).toBeNull();
    expect(error?.code).toBe("42501");
  });
});

describe("AC-3.3.6 a player's RSVP write is rejected for any player id other than their own", () => {
  it("rejects an insert for an open match when player_id belongs to someone else", async () => {
    const { data: openMatch, error: matchError } = await serviceClient
      .from("matches")
      .select("id, rsvp_cutoff_at")
      .eq("status", "scheduled")
      .order("kickoff_at", { ascending: true })
      .limit(1)
      .single();
    if (matchError) throw matchError;
    expect(new Date(openMatch.rsvp_cutoff_at).getTime()).toBeGreaterThan(Date.now());

    const client = await signInAsSeedPlayer(4);
    const someoneElsesId = await playerIdForEmail("p05@pintfc.test");

    const { data, error } = await client
      .from("rsvps")
      .insert({ match_id: openMatch.id, player_id: someoneElsesId, answer: "going" })
      .select();

    expect(data).toBeNull();
    expect(error?.code).toBe("42501");
  });

  it("allows an insert for an open match when player_id is the caller's own", async () => {
    const { data: openMatch, error: matchError } = await serviceClient
      .from("matches")
      .select("id")
      .eq("status", "scheduled")
      .order("kickoff_at", { ascending: true })
      .limit(1)
      .single();
    if (matchError) throw matchError;

    const client = await signInAsSeedPlayer(6);
    const ownId = await playerIdForEmail("p06@pintfc.test");

    const { data, error } = await client
      .from("rsvps")
      .upsert({ match_id: openMatch.id, player_id: ownId, answer: "maybe" }, { onConflict: "match_id,player_id" })
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(1);

    // cleanup so this test stays idempotent across runs
    await serviceClient.from("rsvps").delete().eq("match_id", openMatch.id).eq("player_id", ownId);
  });
});
