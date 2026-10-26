import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app reads live data server-side on every request (session,
  // RSVP counts, consent-filtered profiles) — no static export, per
  // docs/design/architecture.md. Cache Components' prerendering mode
  // would require Suspense-wrapping every dynamic read for no benefit
  // here, so it stays off.
};

export default nextConfig;
