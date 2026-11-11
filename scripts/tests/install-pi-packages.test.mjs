import assert from "node:assert/strict";
import {
  chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const makeBin = spawnSync("which", ["make"], { encoding: "utf8" }).stdout.trim();
const packages = [
  "npm:pi-intercom", "git:github.com/Integralist/pi-auto-model",
  "git:github.com/Integralist/pi-auto-suggest", "git:github.com/Integralist/pi-btw",
  "git:github.com/Integralist/pi-clean-view", "git:github.com/Integralist/pi-context-shake",
  "git:github.com/Integralist/pi-event-hooks", "git:github.com/Integralist/pi-prompt-history",
  "git:github.com/Integralist/pi-skill-argument-hints", "git:github.com/Integralist/pi-stash",
  "git:github.com/Integralist/pi-statusbar", "git:github.com/Integralist/pi-subagents",
  "git:github.com/Integralist/pi-transcript-enhancer",
];

function fixture(t, failSource = packages[4]) {
  const workspace = mkdtempSync(join(tmpdir(), "pi package update "));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  const bin = join(workspace, "bin");
  const events = join(workspace, "events.jsonl");
  mkdirSync(bin);
  const fakePi = `#!/usr/bin/env node
const { appendFileSync, existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const [command, source, approval] = process.argv.slice(2);
if (command === "--version") {
  process.stdout.write("1.5.2\\n");
  process.exit(0);
}
const settingsPath = join(process.env.HOME, ".pi/agent/settings.json");
let registered = false;
if (existsSync(settingsPath)) {
  const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  registered = settings.packages.some(pkg =>
    (typeof pkg === "string" ? pkg : pkg.source) === source);
}
const record = (event) => appendFileSync(process.env.PI_TEST_EVENTS,
  JSON.stringify({ event, source, command, approval, registered, at: Date.now() }) + "\\n");
record("start");
setTimeout(() => {
  record("end");
  if (source === process.env.PI_TEST_FAIL_SOURCE) {
    console.error("simulated update failure for " + source);
    process.exit(1);
  }
  process.exit(0);
}, Number(process.env.PI_TEST_DELAY_MS));
`;
  writeFileSync(join(bin, "pi"), fakePi);
  chmodSync(join(bin, "pi"), 0o755);
  for (const command of ["crit", "npm"]) {
    writeFileSync(join(bin, command), "#!/bin/sh\nexit 0\n");
    chmodSync(join(bin, command), 0o755);
  }
  return {
    events,
    env: {
      ...process.env,
      PATH: bin + delimiter + process.env.PATH,
      HOME: workspace,
      OP_ACCOUNT_NAME: "fastly",
      OP_INJECT_STATUS: "unavailable",
      PI_INSTALL_JOBS: "2",
      PKG_TIMEOUT: "5",
      PI_TEST_EVENTS: events,
      PI_TEST_DELAY_MS: "120",
      PI_TEST_FAIL_SOURCE: failSource,
    },
  };
}

test("Pi package updates run concurrently, preserve settings, and print in order", t => {
  const { events, env } = fixture(t);
  const result = spawnSync(makeBin, ["--no-print-directory", "-f", join(root, "Makefile"),
    "install-pi-section"], {
    cwd: root, encoding: "utf8", env, timeout: 15_000,
  });
  assert.equal(result.error, undefined,
    `${result.error}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const timeline = readFileSync(events, "utf8").trim().split("\n")
    .map(line => JSON.parse(line));
  const starts = timeline.filter(event => event.event === "start");
  assert.equal(starts.length, packages.length);
  assert.ok(starts.every(event => event.command === "update"), JSON.stringify(starts));
  assert.ok(starts.every(event => event.approval === "--no-approve"), JSON.stringify(starts));
  assert.ok(starts.every(event => event.registered), JSON.stringify(starts));

  let active = 0;
  let maximumActive = 0;
  for (const event of timeline) {
    active += event.event === "start" ? 1 : -1;
    maximumActive = Math.max(maximumActive, active);
  }
  assert.equal(maximumActive, 2);

  const output = result.stdout.split("\n");
  const packageLines = output.filter(line =>
    packages.some(source => line.startsWith("  ✅ " + source) || line.startsWith("  🔔 " + source)));
  const reportedPackages = packageLines.map(line =>
    packages.find(source => line.startsWith("  ✅ " + source) || line.startsWith("  🔔 " + source)));
  assert.deepEqual(reportedPackages, packages);
  assert.ok(packageLines[4].includes("🔔") && packageLines[4].includes("failed — skipped"), packageLines[4]);
  assert.equal(readFileSync(join(env.HOME, ".pi/agent/settings.json"), "utf8"),
    readFileSync(join(root, ".pi/agent/settings.json"), "utf8"));
});
