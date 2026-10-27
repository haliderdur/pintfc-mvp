import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Test/build artifacts, not source — gitignored, but this override
    // replaces eslint-config-next's defaults wholesale, so they need
    // restating here too (found when Playwright's bundled trace-viewer
    // JS under playwright-report/ got linted as if it were app code).
    "playwright-report/**",
    "test-results/**",
    // Plain Node CommonJS utility script (not app source) — `require()`
    // is the point of a .cjs file, not something to flag.
    "scripts/mcp-env.cjs",
  ]),
]);

export default eslintConfig;
