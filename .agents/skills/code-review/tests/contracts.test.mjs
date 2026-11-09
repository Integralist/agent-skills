import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const skillPath = ".agents/skills/code-review/SKILL.md";
const protocolPath = ".agents/skills/code-review/references/REVIEW-PROTOCOL.md";
const conventionsPath = ".agents/skills/code-review/references/CONVENTIONS.md";
const casesPath = ".agents/skills/code-review/evals/cases.json";

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function flat(path) {
  return read(path).replace(/\s+/g, " ");
}

function section(content, start, end) {
  const beginning = content.indexOf(start);
  assert.notEqual(beginning, -1, `missing section: ${start}`);
  const finish = content.indexOf(end, beginning + start.length);
  assert.notEqual(finish, -1, `missing section end: ${end}`);
  return content.slice(beginning, finish);
}

test("the entry point loads the protocol and preserves review gates", () => {
  const skill = flat(skillPath);
  assert.ok(skill.includes("[REVIEW-PROTOCOL.md](references/REVIEW-PROTOCOL.md)"));
  assert.match(skill, /a separate conventions reviewer whenever applicable conventions exist/);
  assert.match(skill, /even for small, low-risk changes/);
  assert.match(skill, /Every selected reviewer must finish `COMPLETE`/);
  assert.match(skill, /Never edit code, change state, or comment on a PR/);
  const protocol = flat(protocolPath);
  assert.match(protocol, /intent documents/);
  assert.match(protocol, /reviewer profiles/i);
  assert.match(protocol, /finding schema/);
  assert.match(protocol, /verifier subagent/);
  assert.match(protocol, /report format/i);
});

test("selection considers purpose as well as file type", () => {
  const conventions = flat(conventionsPath);
  for (const name of [
    "conventions-go", "conventions-python", "conventions-sql",
    "conventions-markdown", "conventions-mermaid",
    "conventions-acceptance-tests",
  ]) assert.ok(conventions.includes(name), `missing convention: ${name}`);
  assert.match(conventions, /file type and purpose, not extension alone/);
  assert.match(conventions, /Makefile and shell acceptance workflows/);
  assert.match(conventions, /other available conventions-\* skills/);
  assert.match(conventions, /only when their scope applies/);
  assert.match(conventions, /no applicable conventions/);
});

test("the conventions prompt supplies actual guidance and checks what was loaded", () => {
  const conventions = flat(conventionsPath);
  assert.match(conventions, /resolved absolute paths/);
  assert.match(conventions, /read each selected skill and its applicable linked references before auditing/);
  assert.match(conventions, /Do not assume the subagent inherits loaded skills/);
  assert.match(conventions, /conventions_loaded/);
  assert.match(conventions, /missing or unreadable guidance/);
  assert.match(conventions, /unknown and coverage gap/);
  assert.match(flat(skillPath), /CONVENTIONS\.md/);
});

test("documented rules and unwritten precedent have different evidence requirements", () => {
  const protocol = flat(protocolPath);
  const maintainability = section(protocol, "4. **Maintainability:**", "5. **Conventions:**");
  const conventions = section(protocol, "5. **Conventions:**", "6. **Spec and plan adherence:");
  assert.match(maintainability, /code-module-design/);
  assert.match(maintainability, /Shotgun Surgery/);
  assert.match(maintainability, /Divergent Change/);
  assert.match(maintainability, /Mysterious Name/);
  assert.match(maintainability, /demonstrated cost/);
  assert.match(maintainability, /unwritten precedent/);
  assert.match(maintainability, /at least two peer/);
  assert.match(maintainability, /documented requirements to conventions/);
  assert.match(conventions, /explicit applicable rules/);
  assert.match(conventions, /rule and code evidence/);
  assert.match(conventions, /Recommendations are not mandates/);
  assert.doesNotMatch(maintainability, /Maintainability and conventions/);
  const reliability = section(protocol, "3. **Reliability,", "4. **Maintainability:**");
  assert.match(reliability, /Hand off documented error-handling style to conventions/);

  const verification = section(protocol, "## Verify findings", "## Report format");
  assert.match(verification, /unwritten precedent/);
  assert.match(verification, /documented conventions/);
  assert.match(verification, /scope, exceptions, and precedence/);
  assert.match(verification, /explicit rules need no peer examples/);
});

test("findings and reports carry rule citations and convention coverage", () => {
  const protocol = read(protocolPath);
  const schema = JSON.parse(section(protocol, "## Finding schema and severity", "**Severity**")
    .match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.ok(Array.isArray(schema.conventions_loaded));
  assert.deepEqual(Object.keys(schema.findings[0].rule).sort(),
    ["line", "requirement", "source"]);
  assert.match(flat(protocolPath), /A documented-convention finding requires `rule`/);
  assert.match(flat(protocolPath), /verified explicit convention violation/);
  assert.match(protocol, /### Conventions Coverage/);
  assert.match(protocol, /file(?:\/| or )purpose scope/);
  assert.match(flat(protocolPath), /unresolved gap/);
});

test("review-only boundaries and duplicate merging still apply", () => {
  const skill = flat(skillPath);
  const protocol = flat(protocolPath);
  assert.match(skill, /Never edit code, change state, or comment on a PR/);
  assert.match(protocol, /merge duplicates across profiles/);
  assert.match(protocol, /Keep the worktree untouched/);
  assert.match(flat(conventionsPath), /read-only/);
});

test("evaluation cases cover selection, written rules, conflicts, and missing guidance", () => {
  const cases = JSON.parse(read(casesPath));
  const required = [
    "conventions-small-go",
    "conventions-go-acceptance",
    "conventions-shell-acceptance",
    "conventions-project-exception",
    "conventions-unavailable-guidance",
  ];
  assert.equal(new Set(cases.map(item => item.id)).size, cases.length);
  for (const id of required) {
    const item = cases.find(candidate => candidate.id === id);
    assert.ok(item, `missing evaluation case: ${id}`);
    assert.ok(item.setup.length > 0);
    assert.ok(item.checks.length >= 3);
  }
  const combined = cases.filter(item => required.includes(item.id))
    .flatMap(item => item.checks).join(" ");
  assert.match(combined, /read-only conventions reviewer/);
  assert.match(combined, /explicit rule/);
  assert.match(combined, /unknown/);
});

test("new evaluation fixtures produce branch changes without touching the parent repo", () => {
  const cases = JSON.parse(read(casesPath))
    .filter(item => item.id.startsWith("conventions-"));
  for (const item of cases) {
    const scratch = mkdtempSync(join(tmpdir(), "review-conventions-eval-"));
    try {
      const setup = spawnSync("bash", ["-e", "-c", item.setup.join("\n")], {
        cwd: scratch, encoding: "utf8", timeout: 30_000,
      });
      assert.equal(setup.status, 0, `${item.id}: ${setup.stderr || setup.error}`);
      const diff = spawnSync("git", ["diff", "--name-only", "main...HEAD"], {
        cwd: scratch, encoding: "utf8", timeout: 10_000,
      });
      assert.equal(diff.status, 0, `${item.id}: ${diff.stderr}`);
      assert.ok(diff.stdout.trim(), `${item.id}: fixture has no changes to review`);
      const status = spawnSync("git", ["status", "--porcelain"], {
        cwd: scratch, encoding: "utf8", timeout: 10_000,
      });
      assert.equal(status.status, 0);
      assert.equal(status.stdout, "", `${item.id}: fixture worktree is dirty`);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  }
});

test("new guidance links resolve", () => {
  for (const path of [skillPath, protocolPath, conventionsPath]) {
    const content = read(path);
    for (const match of content.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      if (match[1].includes("://")) continue;
      assert.ok(existsSync(resolve(dirname(resolve(root, path)), match[1])),
        `${path}: broken link ${match[1]}`);
    }
  }
});
