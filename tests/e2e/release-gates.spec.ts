import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { seedPlayerEmail, SEED_FAKE_PASSWORD } from "../../lib/seed-constants";
import { createServiceRoleClient } from "../../lib/supabase/service-role";

try {
  // @ts-expect-error -- loadEnvFile is available on Node 20.12+/22+. See
  // tests/e2e/home.spec.ts / fixtures.spec.ts for the same note: this
  // file's service-role lookups need the key in THIS process.
  process.loadEnvFile(".env.local");
} catch {
  // already loaded, or running where .env.local doesn't exist (CI secrets)
}

async function signIn(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByTestId("signin-email").fill(email);
  await page.getByTestId("signin-password").fill(SEED_FAKE_PASSWORD);
  await page.getByTestId("signin-submit").click();
  await page.waitForURL("/");
}

async function getAnyPlayerId(): Promise<string> {
  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient.from("public_players").select("id").limit(1).single();
  if (error) throw error;
  return data.id;
}

async function getAnyMatchId(): Promise<string> {
  const serviceClient = createServiceRoleClient();
  const { data, error } = await serviceClient.from("matches").select("id").limit(1).single();
  if (error) throw error;
  return data.id;
}

// Session 07's release gates (docs/REQUIREMENTS.md "Design gates kept"):
// AC-5.2 (WCAG AA contrast) and AC-5.4 (no horizontal scroll at 320px),
// checked across every screen built in Sessions 02-06. Neither AC is
// owned by a single row in test-map.md — this session isn't an AC
// owner, it's a cross-cutting verification pass (plans/session-07-release.md).
async function screens(): Promise<{ name: string; goto: (page: Page) => Promise<void> }[]> {
  const playerId = await getAnyPlayerId();
  const matchId = await getAnyMatchId();
  const signedInEmail = seedPlayerEmail(20);

  return [
    { name: "/", goto: async (page) => { await page.goto("/"); } },
    { name: "/squad", goto: async (page) => { await page.goto("/squad"); } },
    { name: "/players/[id]", goto: async (page) => { await page.goto(`/players/${playerId}`); } },
    { name: "/fixtures/[id]", goto: async (page) => { await page.goto(`/fixtures/${matchId}`); } },
    { name: "/sign-in", goto: async (page) => { await page.goto("/sign-in"); } },
    {
      name: "/privacy",
      goto: async (page) => {
        await signIn(page, signedInEmail);
        await page.goto("/privacy");
      },
    },
  ];
}

test.describe("AC-5.2 every release screen passes an automated WCAG AA contrast check", () => {
  test("axe reports zero color-contrast violations on /, /squad, /players/[id], /fixtures/[id], /sign-in, /privacy", async ({
    page,
  }) => {
    for (const screen of await screens()) {
      await screen.goto(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2aa"]).withRules(["color-contrast"]).analyze();
      expect(results.violations, `${screen.name} contrast violations: ${JSON.stringify(results.violations, null, 2)}`).toEqual(
        []
      );
    }
  });
});

test.describe("AC-5.4 every release screen has no horizontal scroll at 320px width", () => {
  test("scrollWidth does not exceed the 320px viewport on /, /squad, /players/[id], /fixtures/[id], /sign-in, /privacy", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    for (const screen of await screens()) {
      await screen.goto(page);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${screen.name} scrollWidth`).toBeLessThanOrEqual(320);
    }
  });
});
