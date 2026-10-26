import { test, expect } from "@playwright/test";
import { seedPlayerEmail, SEED_FAKE_PASSWORD } from "../../lib/seed-constants";
import { createServiceRoleClient } from "../../lib/supabase/service-role";

// "later scheduled match" from scripts/seed.ts (kickoff ~10 days out) —
// picked by ordering descending so this doesn't collide with the
// ascending-order "class demo match" used by Session 01's database tests.
async function getOpenScheduledMatch(serviceClient: ReturnType<typeof createServiceRoleClient>) {
  const { data, error } = await serviceClient
    .from("matches")
    .select("id, rsvp_cutoff_at")
    .eq("status", "scheduled")
    .order("kickoff_at", { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  expect(new Date(data.rsvp_cutoff_at).getTime()).toBeGreaterThan(Date.now());
  return data;
}

test.describe("AC-3.3.2 resubmitting an RSVP replaces the previous answer, not duplicates it", () => {
  test("two POSTs from the same player leave exactly one rsvps row with the latest answer", async ({ request }) => {
    const serviceClient = createServiceRoleClient();
    const match = await getOpenScheduledMatch(serviceClient);

    const email = seedPlayerEmail(13);
    const signInRes = await request.post("/api/auth/sign-in", {
      data: { email, password: SEED_FAKE_PASSWORD },
    });
    expect(signInRes.ok()).toBeTruthy();

    const { data: player, error: playerError } = await serviceClient
      .from("players")
      .select("id")
      .eq("email", email)
      .single();
    if (playerError) throw playerError;

    const firstRes = await request.post(`/api/fixtures/${match.id}/rsvp`, {
      data: { answer: "going" },
    });
    expect(firstRes.ok()).toBeTruthy();

    const secondRes = await request.post(`/api/fixtures/${match.id}/rsvp`, {
      data: { answer: "not_going" },
    });
    expect(secondRes.ok()).toBeTruthy();
    const secondBody = await secondRes.json();
    expect(secondBody.answer).toBe("not_going");

    const { data: rows, error: rowsError } = await serviceClient
      .from("rsvps")
      .select("answer")
      .eq("match_id", match.id)
      .eq("player_id", player.id);
    if (rowsError) throw rowsError;

    expect(rows).toHaveLength(1);
    expect(rows![0].answer).toBe("not_going");

    await serviceClient.from("rsvps").delete().eq("match_id", match.id).eq("player_id", player.id);
  });
});
