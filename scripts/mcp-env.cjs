// Loads .env.local into process.env, substitutes {{VAR}} placeholders in
// the given command's args, then execs it. Lets .mcp.json servers read
// secrets from the gitignored .env.local instead of requiring a
// duplicate OS-level environment variable.
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const envPath = path.join(__dirname, "..", ".env.local");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const [command, ...rawArgs] = process.argv.slice(2);
if (!command) {
  console.error("mcp-env: no command given");
  process.exit(1);
}

const args = rawArgs.map((arg) =>
  arg.replace(/\{\{(\w+)\}\}/g, (_, name) => process.env[name] ?? "")
);

// On win32, spawnSync's shell:true does not escape an args array - it just
// concatenates it (Node even warns: "arguments are not escaped, only
// concatenated"). That silently splits any arg containing a space, e.g. a
// "Header:Bearer <token>" value, into two shell words and loses part of it.
// Quoting each arg ourselves and joining into one command string avoids
// that. The command name itself (e.g. "npx") must stay unquoted, since
// npx.cmd's own path resolution breaks if it's invoked as a quoted token.
let result;
if (process.platform === "win32") {
  const quote = (s) => `"${s.replace(/"/g, '""')}"`;
  const commandLine = [command, ...args.map(quote)].join(" ");
  result = spawnSync(commandLine, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
} else {
  result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
}

process.exit(result.status ?? 1);
