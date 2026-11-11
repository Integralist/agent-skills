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
const helper = join(root, "scripts/install-pi-cli.sh");

function fixture(t, { installed = "1.5.2", latest = "1.5.2", failView = false } = {}) {
  const workspace = mkdtempSync(join(tmpdir(), "pi cli version check "));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  const bin = join(workspace, "bin");
  const log = join(workspace, "npm.jsonl");
  mkdirSync(bin);
  const fakePi = `#!/usr/bin/env node
process.stdout.write(process.env.PI_TEST_INSTALLED + "\\n");
`;
  const fakeNpm = `#!/usr/bin/env node
const { appendFileSync } = require("node:fs");
const [command, ...args] = process.argv.slice(2);
appendFileSync(process.env.PI_TEST_NPM_LOG, JSON.stringify({
  command, args, fetchTimeout: process.env.npm_config_fetch_timeout,
}) + "\\n");
if (command === "view") {
  if (process.env.PI_TEST_FAIL_VIEW === "true") process.exit(1);
  process.stdout.write(process.env.PI_TEST_LATEST + "\\n");
} else if (command !== "install") {
  process.exit(2);
}
`;
  writeFileSync(join(bin, "pi"), fakePi);
  writeFileSync(join(bin, "npm"), fakeNpm);
  chmodSync(join(bin, "pi"), 0o755);
  chmodSync(join(bin, "npm"), 0o755);
  return {
    log,
    env: {
      ...process.env,
      PATH: bin + delimiter + process.env.PATH,
      HOME: workspace,
      PI_TEST_INSTALLED: installed,
      PI_TEST_LATEST: latest,
      PI_TEST_FAIL_VIEW: String(failView),
      PI_TEST_NPM_LOG: log,
      PI_VERSION_CHECK_TIMEOUT: "10000",
    },
  };
}

function runHelper(env) {
  return spawnSync("bash", [helper], {
    cwd: root, encoding: "utf8", env, timeout: 10_000,
  });
}

test("global Pi install is skipped only when the installed version is current", t => {
  const { log, env } = fixture(t);
  const result = runHelper(env);
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.includes("already current (1.5.2)"), result.stdout);
  const calls = readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, "view");
  assert.equal(calls[0].fetchTimeout, "10000");
});

test("outdated or uncheckable Pi installs fall back to npm install", t => {
  for (const options of [
    { installed: "1.5.1", latest: "1.5.2" },
    { installed: "1.5.2", latest: "", failView: true },
  ]) {
    const { log, env } = fixture(t, options);
    const result = runHelper(env);
    assert.equal(result.error, undefined, String(result.error));
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(result.stdout.includes("@earendil-works/pi-coding-agent (npm -g)"), result.stdout);
    const calls = readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line));
    assert.deepEqual(calls.map(call => call.command), ["view", "install"]);
    assert.ok(calls[1].args.includes("-g"), JSON.stringify(calls[1]));
    assert.ok(calls[1].args.includes("@earendil-works/pi-coding-agent"), JSON.stringify(calls[1]));
  }
});
