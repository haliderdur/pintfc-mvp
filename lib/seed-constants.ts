// Shared between scripts/seed.ts and the database test suite, so tests
// can sign in as a seeded player without re-deriving the fake login
// scheme. Fake credentials for fake accounts — see architecture.md.
export const SEED_EMAIL_DOMAIN = "pintfc.test";
export const SEED_FAKE_PASSWORD = "PintFc!Seed2026";

export function seedPlayerEmail(oneIndexed: number): string {
  return `p${String(oneIndexed).padStart(2, "0")}@${SEED_EMAIL_DOMAIN}`;
}
