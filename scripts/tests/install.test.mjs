import assert from "node:assert/strict";
import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const makeBin = spawnSync("which", ["make"], { encoding: "utf8" }).stdout.trim();
const setupTargets = ["install-agents", "rules", "install-tools"];
const sectionTargets = [
  "install-claude-section", "install-pi-section", "install-gemini",
  "install-copilot", "install-opencode", "install-codex", "install-swival",
  "install-google-workspace-mcp",
];
const allTargets = [...setupTargets, ...sectionTargets];
const sectionNames = [
  "Agents", "Rules", "Tools", "Claude", "Pi", "Gemini", "Copilot",
  "OpenCode", "Codex", "Swival", "Google Workspace MCP",
];

function fixture(t, { failTarget = "", failOp = "" } = {}) {
  const workspace = mkdtempSync(join(tmpdir(), "install workflow "));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  const bin = join(workspace, "bin");
  const state = join(workspace, "state");
  mkdirSync(bin);
  mkdirSync(join(state, "started"), { recursive: true });

  const fakeMake = `#!/usr/bin/env node
const { existsSync, mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const setup = ${JSON.stringify(setupTargets)};
const sections = ${JSON.stringify(sectionTargets)};
const target = process.argv[process.argv.length - 1];
const group = setup.includes(target) ? setup : sections;
const state = process.env.FAKE_STATE_DIR;
if (!group.includes(target)) process.exit(2);
if (process.env.OP_INJECT_STATUS !== process.env.FAKE_EXPECT_OP_STATUS) process.exit(3);
if (process.env.OP_INJECT_STATUS === "ready" && !existsSync(join(state, "op-ready")))
  process.exit(3);
writeFileSync(join(state, "started", target), "started");
const deadline = Date.now() + 5000;
function waitForGroup() {
  if (group.every(name => existsSync(join(state, "started", name)))) {
    writeFileSync(join(state, "finished", target), "finished");
    process.stdout.write("Completed: " + target + "\\n");
    process.exit(target === process.env.FAKE_FAIL_TARGET ? 7 : 0);
  }
  if (Date.now() >= deadline) {
    console.error("Targets did not run concurrently: " + target);
    process.exit(91);
  }
  setTimeout(waitForGroup, 10);
}
mkdirSync(join(state, "finished"), { recursive: true });
waitForGroup();
`;
  writeFileSync(join(bin, "make"), fakeMake);
  chmodSync(join(bin, "make"), 0o755);

  const fakeOp = `#!/usr/bin/env node
const { appendFileSync, existsSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const [command, ...args] = process.argv.slice(2);
const state = process.env.FAKE_STATE_DIR;
if (!args.includes("--account") || !args.includes("fastly.1password.com"))
  process.exit(4);
appendFileSync(join(state, "op.log"), command + "\\n");
if (command === process.env.FAKE_OP_FAIL) process.exit(9);
if (command === "signin") {
  writeFileSync(join(state, "op-ready"), "ready");
} else if (command === "vault" && args[0] === "list") {
  if (!existsSync(join(state, "op-ready"))) process.exit(5);
} else if (command !== "inject") {
  process.exit(6);
}
`;
  writeFileSync(join(bin, "op"), fakeOp);
  chmodSync(join(bin, "op"), 0o755);

  return {
    bin,
    state,
    env: {
      ...process.env,
      PATH: bin + delimiter + process.env.PATH,
      HOME: workspace,
      OP_ACCOUNT_NAME: "fastly",
      FAKE_STATE_DIR: state,
      FAKE_EXPECT_OP_STATUS: failOp ? "unavailable" : "ready",
      FAKE_FAIL_TARGET: failTarget,
      FAKE_OP_FAIL: failOp,
    },
  };
}

function runInstall(env) {
  return spawnSync(makeBin, ["--no-print-directory", "-f", join(root, "Makefile"), "install"], {
    cwd: root,
    encoding: "utf8",
    env,
    timeout: 20_000,
  });
}

test("parallel install runs independent targets and prints results in order", t => {
  const { state, env } = fixture(t);
  const result = runInstall(env);
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(readFileSync(join(state, "op.log"), "utf8").trim().split("\n"),
    ["signin", "vault"]);
  for (const target of allTargets)
    assert.ok(existsSync(join(state, "finished", target)), target + " did not finish");
  const output = result.stdout + result.stderr;
  const positions = allTargets.map(target => output.indexOf("Completed: " + target));
  assert.ok(positions.every(position => position >= 0), output);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  const timings = output.slice(output.indexOf("Install timings (elapsed seconds)"));
  assert.ok(timings, output);
  assert.match(timings, /^  1Password\s+\d+s ok$/m);
  for (const name of sectionNames)
    assert.match(timings, new RegExp("^  " + name + "\\s+\\d+s\\s+ok$", "m"));
  assert.ok(output.trimEnd().endsWith("✨ All set."), output);
});

test("parallel install reports section failures after collecting all results", t => {
  const { state, env } = fixture(t, { failTarget: "install-copilot" });
  const result = runInstall(env);
  assert.equal(result.error, undefined, String(result.error));
  assert.notEqual(result.status, 0, result.stdout);
  for (const target of allTargets)
    assert.ok(existsSync(join(state, "finished", target)), target + " was not collected");
  const output = result.stdout + result.stderr;
  assert.ok(output.includes("Completed: install-copilot"), output);
  assert.ok(!output.trimEnd().endsWith("✨ All set."), output);
});

test("failed shared setup prevents dependent installs", t => {
  const { state, env } = fixture(t, { failTarget: "rules" });
  const result = runInstall(env);
  assert.equal(result.error, undefined, String(result.error));
  assert.notEqual(result.status, 0, result.stdout);
  for (const target of setupTargets)
    assert.ok(existsSync(join(state, "finished", target)), target + " was not collected");
  for (const target of sectionTargets)
    assert.equal(existsSync(join(state, "started", target)), false, target + " should wait for setup");
  assert.ok(!(result.stdout + result.stderr).trimEnd().endsWith("✨ All set."));
});

test("unavailable 1Password access is checked once and skips injection", t => {
  const { state, env } = fixture(t, { failOp: "signin" });
  const result = runInstall(env);
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(readFileSync(join(state, "op.log"), "utf8").trim().split("\n"),
    ["signin"]);
  const output = result.stdout + result.stderr;
  assert.ok(output.includes("secret injection will be skipped"));
  assert.match(output.slice(output.indexOf("Install timings (elapsed seconds)")),
    /^  1Password\s+\d+s skipped$/m);
  assert.ok(output.trimEnd().endsWith("✨ All set."));
});

test("injection reuses the coordinator's ready or unavailable status", t => {
  const { state, env } = fixture(t);
  const helper = join(root, "scripts/op-inject.sh");
  env.OP_INJECT_STATUS = "ready";
  writeFileSync(join(state, "op-ready"), "ready");
  let result = spawnSync("bash", [helper, "sample config", "template", "output"], {
    cwd: root, encoding: "utf8", env, timeout: 5_000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.deepEqual(readFileSync(join(state, "op.log"), "utf8").trim().split("\n"),
    ["inject"]);

  env.OP_INJECT_STATUS = "unavailable";
  result = spawnSync("bash", [helper, "sample config", "template", "output"], {
    cwd: root, encoding: "utf8", env, timeout: 5_000,
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.includes("no Fastly 1Password access"), result.stdout);
  assert.deepEqual(readFileSync(join(state, "op.log"), "utf8").trim().split("\n"),
    ["inject"]);
});
