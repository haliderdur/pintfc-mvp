import { test, expect } from "@playwright/test";
import { seedPlayerEmail, SEED_FAKE_PASSWORD } from "../../lib/seed-constants";

test.describe("AC-1.6.4 a stale session cookie after sign-out grants no player privileges", () => {
  test("replaying pre-sign-out cookies against the home page renders signed-out header markup", async ({
    request,
    playwright,
    baseURL,
  }) => {
    const signInRes = await request.post("/api/auth/sign-in", {
      data: { email: seedPlayerEmail(12), password: SEED_FAKE_PASSWORD },
    });
    expect(signInRes.ok()).toBeTruthy();

    // Snapshot the cookies as they are right after sign-in, before
    // signing out — this is the "stale" cookie a reused tab/device
    // would still be holding.
    const staleStorageState = await request.storageState();

    const signOutRes = await request.post("/api/auth/sign-out");
    expect(signOutRes.status()).toBe(204);

    const staleContext = await playwright.request.newContext({ baseURL, storageState: staleStorageState });
    const homeRes = await staleContext.get("/");
    const body = await homeRes.text();

    expect(body).not.toContain('data-testid="header-signout"');
    expect(body).toContain('data-testid="header-signin"');

    await staleContext.dispose();
  });
});
