import { test, expect, type Page } from "@playwright/test";
import { seedPlayerEmail, SEED_FAKE_PASSWORD } from "../../lib/seed-constants";

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByTestId("signin-email").fill(email);
  await page.getByTestId("signin-password").fill(SEED_FAKE_PASSWORD);
  await page.getByTestId("signin-submit").click();
  await page.waitForURL("/");
}

test.describe("AC-4.3.4 a minor without guardian consent sees opt-in privacy toggles locked, and the server rejects enabling them", () => {
  test("shows locked toggles in the UI and a direct PATCH to enable one still gets 403", async ({ page }) => {
    // Seed index 1 (p02): minor, no guardian consent, but photo/nationality
    // already flipped true on their own row (scripts/seed.ts) — locked
    // regardless of that stored value (AC-4.2.2).
    await signIn(page, seedPlayerEmail(2));

    await page.goto("/privacy");
    await expect(page.getByTestId("privacy-toggle-photo-locked")).toBeVisible();
    await expect(page.getByTestId("privacy-toggle-nationality-locked")).toBeVisible();
    await expect(page.getByTestId("privacy-toggle-stats-locked")).toBeVisible();
    await expect(page.getByTestId("privacy-toggle-photo-locked")).toBeDisabled();

    const res = await page.request.patch("/api/privacy", { data: { statsConsent: true } });
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN_MINOR_CONSENT");
  });
});
