import { test, expect, request as apiRequest } from "@playwright/test";
import { seedPlayerEmail, SEED_FAKE_PASSWORD } from "../../lib/seed-constants";
import { createServiceRoleClient } from "../../lib/supabase/service-role";

try {
  // @ts-expect-error -- loadEnvFile is available on Node 20.12+/22+. The
  // Playwright test process doesn't load .env.local the way the Next.js
  // webServer it spawns does — this file's test needs the service-role
  // key directly in THIS process to look up the player id (see Session
  // 06's tests/e2e/fixtures.spec.ts for the same fix).
  process.loadEnvFile(".env.local");
} catch {
  // already loaded, or running where .env.local doesn't exist (CI secrets)
}

// Seed index 3 (p04): photo false, nationality false, stats true — see
// tests/database/profile-privacy.test.ts's AC-4.2.1 comment for the same
// fixture. Not a minor, so toggling either direction is always allowed.
test.describe("AC-4.3.2 toggling a consent field takes effect on the public profile immediately", () => {
  test("turning nationality consent on then off is reflected on the public profile right away", async ({
    request,
  }) => {
    const serviceClient = createServiceRoleClient();
    const email = seedPlayerEmail(4);
    const { data: player, error } = await serviceClient.from("players").select("id").eq("email", email).single();
    if (error) throw error;

    const signInRes = await request.post("/api/auth/sign-in", {
      data: { email, password: SEED_FAKE_PASSWORD },
    });
    expect(signInRes.ok()).toBeTruthy();

    // A separate, signed-out context for the "public profile" side of this
    // check — fetching the profile with the same cookies as the player
    // toggling their own consent would hit the "viewing your own profile"
    // path (AC-4.3.3), which always shows every field regardless of
    // consent and would hide the bug this test is meant to catch.
    const publicContext = await apiRequest.newContext({ baseURL: "http://localhost:3100" });

    try {
      const onRes = await request.patch("/api/privacy", { data: { nationalityConsent: true } });
      expect(onRes.ok()).toBeTruthy();

      const pageAfterOn = await publicContext.get(`/players/${player.id}`);
      expect(await pageAfterOn.text()).toContain('data-testid="profile-field-nationality"');

      const offRes = await request.patch("/api/privacy", { data: { nationalityConsent: false } });
      expect(offRes.ok()).toBeTruthy();

      const pageAfterOff = await publicContext.get(`/players/${player.id}`);
      expect(await pageAfterOff.text()).not.toContain('data-testid="profile-field-nationality"');
    } finally {
      await publicContext.dispose();
    }
  });
});
