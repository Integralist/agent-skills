#!/usr/bin/env node
import { spawn } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const step = join(root, "scripts/step.sh");
const sources = process.argv.slice(2);

function positiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1)
    throw new Error(name + " must be a positive integer");
  return parsed;
}

function runStep(source, timeout, logDir, index) {
  return new Promise(resolveResult => {
    const logFile = join(logDir, index + ".log");
    const logFd = openSync(logFile, "w");
    let child;
    try {
      child = spawn("bash", [step, "--timing", "--timeout", String(timeout),
        "--optional", source, "pi", "update", source, "--no-approve"], {
        cwd: root,
        env: process.env,
        stdio: ["ignore", logFd, logFd],
      });
    } catch (error) {
      closeSync(logFd);
      resolveResult({ source, status: null, logFile, error });
      return;
    }
    closeSync(logFd);
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      resolveResult(result);
    };
    child.once("error", error => finish({ source, status: null, logFile, error }));
    child.once("close", status => finish({ source, status, logFile }));
  });
}

async function runPool(items, concurrency, timeout, logDir) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await runStep(items[index], timeout, logDir, index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  if (sources.length === 0) throw new Error("no Pi package sources were provided");
  const concurrency = positiveInteger(process.env.PI_INSTALL_JOBS ?? "4", "PI_INSTALL_JOBS");
  const timeout = positiveInteger(process.env.PKG_TIMEOUT ?? "30", "PKG_TIMEOUT");
  const logDir = mkdtempSync(join(tmpdir(), "pi-package-updates-"));
  try {
    const results = await runPool(sources, concurrency, timeout, logDir);
    let failed = false;
    for (const result of results) {
      process.stdout.write(readFileSync(result.logFile, "utf8"));
      if (result.error) {
        process.stderr.write("install-pi-packages: " + result.error.message + "\n");
        failed = true;
      } else if (result.status !== 0) {
        failed = true;
      }
    }
    if (failed) process.exitCode = 1;
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error("install-pi-packages: " + error.message);
  process.exitCode = 1;
});
