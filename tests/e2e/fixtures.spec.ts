import { test, expect, type Page } from "@playwright/test";
import { seedPlayerEmail, SEED_FAKE_PASSWORD } from "../../lib/seed-constants";
import { createServiceRoleClient } from "../../lib/supabase/service-role";

try {
  // @ts-expect-error -- loadEnvFile is available on Node 20.12+/22+. The
  // Playwright test process doesn't load .env.local the way the Next.js
  // webServer it spawns does — this file's tests need the service-role
  // key directly in THIS process to arrange/restore DB state.
  process.loadEnvFile(".env.local");
} catch {
  // already loaded, or running where .env.local doesn't exist (CI secrets)
}

// Same "later scheduled match" the API spec targets — open RSVP window,
// read-only lookup via the service-role client (test setup only).
async function getOpenScheduledMatchId(): Promise<string> {
  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient
    .from("matches")
    .select("id, rsvp_cutoff_at")
    .eq("status", "scheduled")
    .order("kickoff_at", { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  expect(new Date(data.rsvp_cutoff_at).getTime()).toBeGreaterThan(Date.now());
  return data.id;
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByTestId("signin-email").fill(email);
  await page.getByTestId("signin-password").fill(SEED_FAKE_PASSWORD);
  await page.getByTestId("signin-submit").click();
  // Sign-in is a client-side fetch + router.push("/") (see
  // app/sign-in/page.tsx) — wait for that navigation so the session
  // cookie is actually set before the caller navigates elsewhere.
  await page.waitForURL("/");
}

test.describe("AC-3.3.1 a signed-in player can RSVP Going, Maybe or Not going before the cutoff", () => {
  test("clicking an RSVP button updates the roster with that answer", async ({ page }) => {
    const matchId = await getOpenScheduledMatchId();
    await signIn(page, seedPlayerEmail(13));

    await page.goto(`/fixtures/${matchId}`);
    await page.getByTestId("fixture-rsvp-going").click();
    await expect(page.getByTestId("fixture-roster")).toContainText("going");

    await page.getByTestId("fixture-rsvp-maybe").click();
    await expect(page.getByTestId("fixture-roster")).toContainText("maybe");

    await page.getByTestId("fixture-rsvp-not-going").click();
    await expect(page.getByTestId("fixture-roster")).toContainText("not_going");
  });
});

test.describe("AC-3.3.5 a signed-out visitor cannot see or use the RSVP control", () => {
  test("the fixture page shows no RSVP buttons or roster for a visitor", async ({ page }) => {
    const matchId = await getOpenScheduledMatchId();
    await page.goto(`/fixtures/${matchId}`);

    await expect(page.getByTestId("fixture-rsvp-going")).toHaveCount(0);
    await expect(page.getByTestId("fixture-rsvp-maybe")).toHaveCount(0);
    await expect(page.getByTestId("fixture-rsvp-not-going")).toHaveCount(0);
    await expect(page.getByTestId("fixture-rsvp-closed")).toHaveCount(0);
    await expect(page.getByTestId("fixture-roster")).toHaveCount(0);
  });
});

test.describe("AC-3.4.1 the open fixture page shows RSVP counts without requiring sign-in", () => {
  test("a visitor sees the going/maybe/not-going counts", async ({ page }) => {
    const matchId = await getOpenScheduledMatchId();
    await page.goto(`/fixtures/${matchId}`);

    await expect(page.getByTestId("fixture-count-going")).toBeVisible();
    await expect(page.getByTestId("fixture-count-maybe")).toBeVisible();
    await expect(page.getByTestId("fixture-count-not-going")).toBeVisible();
  });
});

test.describe("AC-3.4.3 fixture page counts update within 15 seconds of another player's RSVP change", () => {
  test("a visitor's open fixture page reflects another player's RSVP without reloading", async ({ browser }) => {
    const matchId = await getOpenScheduledMatchId();

    // Clear any leftover row from a previous run so clicking "maybe"
    // below is guaranteed to change the count (absent -> present), not a
    // same-value no-op upsert.
    const serviceClient = createServiceRoleClient();
    const { data: actorPlayer, error: actorPlayerError } = await serviceClient
      .from("players")
      .select("id")
      .eq("email", seedPlayerEmail(14))
      .single();
    if (actorPlayerError) throw actorPlayerError;
    await serviceClient.from("rsvps").delete().eq("match_id", matchId).eq("player_id", actorPlayer.id);

    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    await viewerPage.goto(`/fixtures/${matchId}`);
    const beforeText = await viewerPage.getByTestId("fixture-count-maybe").textContent();

    const actorContext = await browser.newContext();
    const actorPage = await actorContext.newPage();
    await signIn(actorPage, seedPlayerEmail(14));
    await actorPage.goto(`/fixtures/${matchId}`);
    await actorPage.getByTestId("fixture-rsvp-maybe").click();

    await expect(async () => {
      const afterText = await viewerPage.getByTestId("fixture-count-maybe").textContent();
      expect(afterText).not.toBe(beforeText);
    }).toPass({ timeout: 15_000 });

    await viewerContext.close();
    await actorContext.close();

    await serviceClient.from("rsvps").delete().eq("match_id", matchId).eq("player_id", actorPlayer.id);
  });
});
