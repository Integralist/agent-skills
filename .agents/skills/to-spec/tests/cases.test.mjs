import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const skills = ["to-spec", "voice-product"];
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;

test("spec output keeps local files and GitHub artifacts in separate branches", () => {
  const skill = readFileSync(join(root, ".agents/skills/to-spec/SKILL.md"), "utf8");
  const step = skill.split("4. **Write and check.**")[1]?.split("**Done when**")[0];
  assert.ok(step, "write/check step is missing");
  const branches = step.split(/- \*\*(?:On disk|GitHub):\*\*/);
  assert.equal(branches.length, 3, "write/check needs both output branches");
  const [common, disk, github] = branches.map(text => text.replace(/\s+/g, " "));
  assert.doesNotMatch(common, /projects\/|PROJECTS-README|Root Issue Artifact/);
  assert.match(disk, /projects\/<yyyy-mm-dd>-<slug>\/spec\.md/);
  assert.match(disk, /\[PROJECTS-README\.md\]\(\.\.\/shared\/PROJECTS-README\.md\)/);
  assert.match(github, /\[GITHUB-ISSUES\.md\]\(\.\.\/shared\/GITHUB-ISSUES\.md\)/);
  assert.match(github, /Root Issue Artifact/);
  assert.doesNotMatch(github, /projects\/|PROJECTS-README/);
});

function fixtureEnvironment(inherited = process.env) {
  const env = Object.fromEntries(Object.entries(inherited)
    .filter(([name]) => !name.startsWith("GIT_")));
  return { ...env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
}

test("fixture Git writes cannot use an inherited external index", () => {
  const scratch = realpathSync(mkdtempSync(join(tmpdir(), "spec-git-isolation-")));
  const external = join(scratch, "external");
  const fixture = join(scratch, "fixture");
  mkdirSync(external);
  mkdirSync(fixture);
  const clean = Object.fromEntries(Object.entries(process.env)
    .filter(([name]) => !name.startsWith("GIT_")));
  Object.assign(clean, { GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" });
  const run = (cwd, command, env) => spawnSync("bash", ["-e", "-u", "-o", "pipefail", "-c",
    `cd ${quote(cwd)} || exit 1\n${command}`], {
    cwd, env, encoding: "utf8", timeout: 15_000,
  });
  try {
    const seed = run(external,
      "git init -q -b eval && printf original > original.txt && git add original.txt", clean);
    assert.equal(seed.status, 0, seed.stderr || seed.error);
    const index = join(external, ".git", "index");
    const before = readFileSync(index);
    const env = fixtureEnvironment({ ...clean, GIT_INDEX_FILE: index });
    const setup = run(fixture,
      "git init -q -b eval && printf fixture > fixture.txt && git add fixture.txt", env);
    assert.equal(setup.status, 0, setup.stderr || setup.error);
    assert.deepEqual(readFileSync(index), before, "fixture modified the external Git index");

    const routed = fixtureEnvironment({
      ...clean, GIT_DIR: join(external, ".git"), GIT_WORK_TREE: external,
      GIT_CONFIG_COUNT: "1", GIT_CONFIG_KEY_0: "core.worktree", GIT_CONFIG_VALUE_0: external,
    });
    for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_CONFIG_COUNT", "GIT_CONFIG_KEY_0", "GIT_CONFIG_VALUE_0"])
      assert.equal(routed[key], undefined, `inherited ${key} survived`);
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

for (const skill of skills) {
  const cases = JSON.parse(readFileSync(
    join(root, ".agents/skills", skill, "evals/cases.json"), "utf8",
  ));

  test(`${skill} cases have distinct IDs and executable fixtures`, () => {
    assert.ok(Array.isArray(cases) && cases.length > 0);
    assert.equal(new Set(cases.map(item => item.id)).size, cases.length);
    for (const item of cases) {
      assert.match(item.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.equal(typeof item.prompt, "string");
      assert.ok(item.prompt.trim());
      for (const field of ["setup", "checks", "verify"]) {
        assert.ok(Array.isArray(item[field]) && item[field].length > 0,
          `${item.id}: missing ${field}`);
        assert.ok(item[field].every(value => typeof value === "string" && value.trim()),
          `${item.id}: invalid ${field}`);
      }
    }
  });

  for (const item of cases) {
    test(`${skill}/${item.id} setup works and verification rejects an untouched fixture`, () => {
      const scratch = realpathSync(mkdtempSync(join(tmpdir(), "spec-writing-case-")));
      const env = fixtureEnvironment();
      const run = command => spawnSync("bash", ["-e", "-u", "-o", "pipefail", "-c",
        `cd ${quote(scratch)} || exit 1\n${command}`], {
        cwd: scratch, env, encoding: "utf8", timeout: 15_000,
      });
      try {
        // Initialize and verify the repository before any fixture Git commands.
        const init = run("git init -q -b eval");
        assert.equal(init.status, 0, init.stderr || init.error);
        const top = run("git rev-parse --show-toplevel");
        assert.equal(top.status, 0, top.stderr || top.error);
        assert.equal(realpathSync(top.stdout.trim()), scratch);

        const setup = run(item.setup.join("\n"));
        assert.equal(setup.status, 0, `${item.id}: ${setup.stderr || setup.error}`);
        const results = item.verify.map(command => run(command));
        assert.ok(results.every(result => result.status !== null),
          `${item.id}: a verification command did not finish`);
        assert.ok(results.some(result => result.status !== 0),
          `${item.id}: verification accepts the unchanged starting state`);
      } finally {
        rmSync(scratch, { recursive: true, force: true });
      }
    });
  }
}
