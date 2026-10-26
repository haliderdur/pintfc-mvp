import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  // Tests sign in against the real Supabase Auth project (no local
  // instance available — see DECISIONS.md D12); a burst of sign-ins can
  // transiently hit Supabase's own auth rate limit, so allow one retry.
  retries: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
