// Parses docs/design/test-map.md's AC table and fails if any acceptance
// check id is missing an owning test or owned by more than one row.
// Run as part of every session's exit gate (docs/design/test-map.md).
import { readFileSync } from "node:fs";

const EXPECTED_TOTAL = 38;
const path = "docs/design/test-map.md";
const text = readFileSync(path, "utf8");

const rowPattern = /^\|\s*(AC-\d+\.\d+\.\d+)\s*\|\s*([\w-]+)\s*\|/gm;
const seen = new Map();
let match;
while ((match = rowPattern.exec(text)) !== null) {
  const [, acId] = match;
  seen.set(acId, (seen.get(acId) ?? 0) + 1);
}

const problems = [];
for (const [acId, count] of seen) {
  if (count > 1) problems.push(`${acId} has ${count} owning rows (expected exactly 1)`);
}
if (seen.size !== EXPECTED_TOTAL) {
  problems.push(`found ${seen.size} AC rows, expected ${EXPECTED_TOTAL}`);
}

if (problems.length > 0) {
  console.error("plan-check failed:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`plan-check passed: ${seen.size}/${EXPECTED_TOTAL} acceptance checks, each with exactly one owning test.`);
