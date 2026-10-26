try {
  // @ts-expect-error -- loadEnvFile is available on Node 20.12+/22+.
  process.loadEnvFile(".env.local");
} catch {
  // already loaded, or running where .env.local doesn't exist (CI secrets)
}
