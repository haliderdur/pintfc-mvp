import { test, expect, type Page } from "@playwright/test";
import { createServiceRoleClient } from "../../lib/supabase/service-role";

try {
  // @ts-expect-error -- loadEnvFile is available on Node 20.12+/22+. The
  // Playwright test process doesn't load .env.local the way the Next.js
  // webServer it spawns does (QA finding: this file's forced-scenario
  // tests below need the service-role key directly in THIS process to
  // arrange/restore DB state, not just inside the server under test).
  process.loadEnvFile(".env.local");
} catch {
  // already loaded, or running where .env.local doesn't exist (CI secrets)
}

type UpcomingMatch = { id: string; kickoff_at: string; status: "scheduled" | "cancelled" };

// Snapshot every currently-scheduled/cancelled ("upcoming") match so a
// forced-scenario test can flip statuses and restore them exactly,
// without ever deleting a row (CLAUDE.md "Destructive actions").
async function getUpcomingMatches(serviceClient: ReturnType<typeof createServiceRoleClient>): Promise<UpcomingMatch[]> {
  const { data, error } = await serviceClient
    .from("matches")
    .select("id, kickoff_at, status")
    .in("status", ["scheduled", "cancelled"])
    .order("kickoff_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function setStatuses(
  serviceClient: ReturnType<typeof createServiceRoleClient>,
  rows: { id: string; status: string }[],
) {
  for (const row of rows) {
    const { error } = await serviceClient.from("matches").update({ status: row.status }).eq("id", row.id);
    if (error) throw error;
  }
}

// The home page is a single async Server Component (no Suspense
// boundary of its own below app/loading.tsx), so its data fetch can
// still be in flight for a moment after `page.goto()` resolves. Wait for
// one of the two mutually-exclusive terminal markers before branching on
// `isVisible()`, instead of racing the fetch.
async function waitForNextMatchSettled(page: Page) {
  await expect(page.getByTestId("home-next-match").or(page.getByTestId("home-next-match-empty"))).toBeVisible();
}

async function waitForResultsSettled(page: Page) {
  await expect(page.getByTestId("home-results-list").or(page.getByTestId("home-results-empty"))).toBeVisible();
}

test.describe("AC-2.1.1 home page shows the next match's opponent, venue and local kickoff time", () => {
  test("the next-match card shows opponent, venue and kickoff when one exists", async ({ page }) => {
    await page.goto("/");
    await waitForNextMatchSettled(page);
    const nextMatch = page.getByTestId("home-next-match");
    if (await nextMatch.isVisible()) {
      await expect(nextMatch).not.toHaveText("");
    } else {
      await expect(page.getByTestId("home-next-match-empty")).toBeVisible();
    }
  });
});

test.describe("AC-2.1.2 the next-match countdown advances without a page reload", () => {
  test("the countdown text changes over time while staying on the same page", async ({ page }) => {
    await page.goto("/");
    await waitForNextMatchSettled(page);
    const countdown = page.getByTestId("home-countdown");
    if (!(await countdown.isVisible())) return;

    const before = await countdown.textContent();
    await page.waitForTimeout(1500);
    const after = await countdown.textContent();

    expect(page.url()).toContain("/");
    expect(after).not.toBe(before);
  });
});

test.describe("AC-2.1.3 a cancelled next match is labeled Cancelled instead of counting down", () => {
  test("shows a Cancelled badge instead of a countdown when the next match is cancelled", async ({ page }) => {
    await page.goto("/");
    await waitForNextMatchSettled(page);
    const nextMatch = page.getByTestId("home-next-match");
    if (!(await nextMatch.isVisible())) return;

    const text = await nextMatch.textContent();
    if (text?.includes("Cancelled")) {
      await expect(page.getByTestId("home-countdown")).not.toBeVisible();
    } else {
      await expect(page.getByTestId("home-countdown")).toBeVisible();
    }
  });
});

test.describe("AC-2.1.4 home page shows an empty state when there is no upcoming match", () => {
  test("shows exactly one of the next-match card or its empty state", async ({ page }) => {
    await page.goto("/");
    await waitForNextMatchSettled(page);
    const hasMatch = await page.getByTestId("home-next-match").isVisible();
    const isEmpty = await page.getByTestId("home-next-match-empty").isVisible();
    expect(hasMatch !== isEmpty).toBe(true);
  });
});

// Today's seed always has a soon scheduled match ("demo match") that
// becomes "next" before the seeded cancelled match, and a far-future
// scheduled match that keeps an upcoming match always present — so
// AC-2.1.3's Cancelled branch and AC-2.1.4's empty-state branch never
// occur naturally. These two tests arrange each scenario directly via
// the service-role client, assert, then restore the original statuses
// in a finally block and verify the restore before finishing.
test.describe("AC-2.1.3 (forced) a cancelled next match is labeled Cancelled instead of counting down", () => {
  test("shows a Cancelled badge instead of a countdown when the cancelled seeded match is the earliest upcoming one", async ({
    page,
  }) => {
    const serviceClient = createServiceRoleClient();
    const before = await getUpcomingMatches(serviceClient);
    const cancelledTarget = before
      .filter((m) => m.status === "cancelled")
      .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())[0];
    expect(cancelledTarget, "seed must contain at least one cancelled upcoming match").toBeTruthy();

    // Every match earlier than (or tied with) the cancelled target would
    // otherwise be picked as "next" first — push them out of the
    // scheduled/cancelled pool for the duration of the test only.
    const toSuppress = before.filter(
      (m) => m.id !== cancelledTarget.id && new Date(m.kickoff_at).getTime() <= new Date(cancelledTarget.kickoff_at).getTime(),
    );
    const originalStatuses = toSuppress.map((m) => ({ id: m.id, status: m.status }));

    try {
      await setStatuses(serviceClient, toSuppress.map((m) => ({ id: m.id, status: "completed" })));

      await page.goto("/");
      const nextMatch = page.getByTestId("home-next-match");
      await expect(nextMatch).toBeVisible();
      await expect(page.getByTestId("home-next-match-cancelled")).toBeVisible();
      await expect(page.getByTestId("home-next-match-cancelled")).toHaveText("Cancelled");
      await expect(page.getByTestId("home-countdown")).not.toBeVisible();
    } finally {
      await setStatuses(serviceClient, originalStatuses);

      const after = await getUpcomingMatches(serviceClient);
      for (const original of before) {
        const restored = after.find((m) => m.id === original.id);
        expect(restored, `match ${original.id} should still be upcoming after restore`).toBeTruthy();
        expect(restored?.status).toBe(original.status);
      }
    }
  });
});

test.describe("AC-2.1.4 (forced) home page shows an empty state when there is genuinely no upcoming match", () => {
  test("shows the empty state, and no next-match card, when every scheduled/cancelled match is temporarily completed", async ({
    page,
  }) => {
    const serviceClient = createServiceRoleClient();
    const before = await getUpcomingMatches(serviceClient);
    expect(before.length, "seed must contain at least one upcoming match to suppress").toBeGreaterThan(0);
    const originalStatuses = before.map((m) => ({ id: m.id, status: m.status }));

    try {
      // Flip status only — never delete a row (CLAUDE.md "Destructive actions").
      await setStatuses(serviceClient, before.map((m) => ({ id: m.id, status: "completed" })));

      await page.goto("/");
      await expect(page.getByTestId("home-next-match-empty")).toBeVisible();
      await expect(page.getByTestId("home-next-match-empty")).toHaveText("No upcoming match scheduled.");
      await expect(page.getByTestId("home-next-match")).not.toBeVisible();
    } finally {
      await setStatuses(serviceClient, originalStatuses);

      const after = await getUpcomingMatches(serviceClient);
      expect(after.length).toBe(before.length);
      for (const original of before) {
        const restored = after.find((m) => m.id === original.id);
        expect(restored, `match ${original.id} should still be upcoming after restore`).toBeTruthy();
        expect(restored?.status).toBe(original.status);
      }
    }
  });
});

test.describe("AC-2.1.5 home page has no horizontal scroll at 320px width", () => {
  test("scrollWidth does not exceed the 320px viewport", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });
});

test.describe("AC-2.2.3 latest results are listed most-recent-first with opponent, score and competition", () => {
  test("lists published results with opponent, score and competition type", async ({ page }) => {
    await page.goto("/");
    await waitForResultsSettled(page);
    const resultsList = page.getByTestId("home-results-list");
    if (!(await resultsList.isVisible())) return;

    const items = resultsList.locator("li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    await expect(items.first()).toHaveText(/\d+-\d+/);
    await expect(items.first()).toHaveText(/league|friendly/);
  });
});

test.describe("AC-2.2.4 home page shows an empty state when there are no published results", () => {
  test("shows exactly one of the results list or its empty state", async ({ page }) => {
    await page.goto("/");
    await waitForResultsSettled(page);
    const hasResults = await page.getByTestId("home-results-list").isVisible();
    const isEmpty = await page.getByTestId("home-results-empty").isVisible();
    expect(hasResults !== isEmpty).toBe(true);
  });
});

test.describe("AC-2.3.1 the mini league table shows the seeded standings snapshot", () => {
  test("shows standings rows with position, team and points", async ({ page }) => {
    await page.goto("/");
    const table = page.getByTestId("home-league-table");
    await expect(table).toBeVisible();
    const rows = table.locator("tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);
    await expect(table).toContainText("PINT FC");
  });
});

test.describe("AC-2.3.2 PINT FC's row in the mini table is visually distinguished", () => {
  test("PINT FC's row carries a distinguishing class", async ({ page }) => {
    await page.goto("/");
    const pintFcRow = page.getByTestId("home-league-table").locator("tr", { hasText: "PINT FC" });
    const className = await pintFcRow.getAttribute("class");
    expect(className).toMatch(/pintFcRow/i);
  });
});

test.describe("AC-2.4.1 home page squad teaser shows active players and links to the full squad", () => {
  test("shows a handful of players and a link to /squad", async ({ page }) => {
    await page.goto("/");
    const teaser = page.getByTestId("home-squad-teaser");
    await expect(teaser).toBeVisible();
    const items = teaser.locator("li");
    expect(await items.count()).toBeGreaterThan(0);
    await expect(teaser.getByRole("link", { name: /see full squad/i })).toHaveAttribute("href", "/squad");
  });
});

test.describe("AC-2.4.3 the squad teaser's link opens the same squad page as /squad", () => {
  test("clicking the teaser link navigates to /squad", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-squad-teaser").getByRole("link", { name: /see full squad/i }).click();
    await expect(page).toHaveURL(/\/squad$/);
  });
});
