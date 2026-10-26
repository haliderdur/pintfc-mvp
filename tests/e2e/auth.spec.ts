import { test, expect } from "@playwright/test";
import { seedPlayerEmail, SEED_FAKE_PASSWORD } from "../../lib/seed-constants";

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/sign-in");
  await page.getByTestId("signin-email").fill(email);
  await page.getByTestId("signin-password").fill(SEED_FAKE_PASSWORD);
  await page.getByTestId("signin-submit").click();
}

test.describe("AC-1.1.1 a seeded player can sign in with their fake credentials", () => {
  test("signs in and the header reflects signed-in state", async ({ page }) => {
    await signIn(page, seedPlayerEmail(7));
    await expect(page.getByTestId("header-signout")).toBeVisible();
  });
});

test.describe("AC-1.1.3 sign-in is rejected for wrong credentials with a generic error", () => {
  test("shows a generic error and creates no session", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByTestId("signin-email").fill(seedPlayerEmail(7));
    await page.getByTestId("signin-password").fill("definitely-wrong-password");
    await page.getByTestId("signin-submit").click();
    await expect(page.getByTestId("signin-error")).toBeVisible();
    await expect(page.getByTestId("signin-error")).toHaveText(/incorrect email or password/i);

    await page.goto("/");
    await expect(page.getByTestId("header-signin")).toBeVisible();
  });
});

test.describe("AC-1.1.4 a signed-in player stays signed in across a reload", () => {
  test("stays signed in after a reload and in a new tab", async ({ page, context }) => {
    await signIn(page, seedPlayerEmail(8));
    await expect(page.getByTestId("header-signout")).toBeVisible();

    await page.reload();
    await expect(page.getByTestId("header-signout")).toBeVisible();

    const newTab = await context.newPage();
    await newTab.goto("/");
    await expect(newTab.getByTestId("header-signout")).toBeVisible();
  });
});

test.describe("AC-1.6.1 sign out ends the session on this device", () => {
  test("signing out returns the header to signed-out state", async ({ page }) => {
    await signIn(page, seedPlayerEmail(9));
    await expect(page.getByTestId("header-signout")).toBeVisible();

    await page.getByTestId("header-signout").click();
    await expect(page.getByTestId("header-signin")).toBeVisible();
  });
});

test.describe("AC-1.6.2 sign out of all devices revokes every session", () => {
  test("the device that signed out everywhere ends up signed out too", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await signIn(page, seedPlayerEmail(10));
    await expect(page.getByTestId("header-signout")).toBeVisible();

    await page.getByTestId("header-signout-all").click();
    await expect(page.getByTestId("header-signin")).toBeVisible();

    await context.close();
  });
});

test.describe("AC-1.6.3 signing out of all devices invalidates a second device's session", () => {
  test("a second signed-in device is treated as signed out after the first signs out everywhere", async ({
    browser,
  }) => {
    const email = seedPlayerEmail(11);
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await signIn(pageA, email);
    await expect(pageA.getByTestId("header-signout")).toBeVisible();
    await signIn(pageB, email);
    await expect(pageB.getByTestId("header-signout")).toBeVisible();

    await pageA.getByTestId("header-signout-all").click();
    await expect(pageA.getByTestId("header-signin")).toBeVisible();

    await pageB.reload();
    await expect(pageB.getByTestId("header-signin")).toBeVisible();

    await contextA.close();
    await contextB.close();
  });
});
