import { test, expect } from "@playwright/test";

test.describe("AC-4.1.1 the squad page lists all active players grouped by position", () => {
  test("shows all 40 active players as links, and never the archived player", async ({ page }) => {
    await page.goto("/squad");
    const links = page.locator("a[data-testid^='squad-player-']");
    await expect(links.first()).toBeVisible();
    expect(await links.count()).toBe(40);
    await expect(page.getByText("Casey Retired")).toHaveCount(0);
  });
});

test.describe("AC-4.1.3 clicking a squad entry opens that player's profile", () => {
  test("navigates to that player's profile page", async ({ page }) => {
    await page.goto("/squad");
    const firstLink = page.locator("a[data-testid^='squad-player-']").first();
    const name = (await firstLink.textContent())?.trim() ?? "";
    await firstLink.click();

    await expect(page).toHaveURL(/\/players\/[^/]+$/);
    await expect(page.getByTestId("profile-name")).toBeVisible();
    expect(name).toContain((await page.getByTestId("profile-name").textContent())?.trim());
  });
});
