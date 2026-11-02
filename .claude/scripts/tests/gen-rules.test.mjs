import assert from "node:assert/strict";
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync,
  symlinkSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const rules = [
  ["conventions-go", "go", "**/*.go"],
  ["conventions-markdown", "markdown", "**/*.md"],
  ["conventions-mermaid", "mermaid", "**/*.{mmd,mermaid}"],
  ["conventions-python", "python", "**/*.py"],
  ["conventions-sql", "sql", "**/*.sql"],
  ["spec-delta", "spec-delta", "docs/specs/**"],
];

function fixture(t) {
  const workspace = mkdtempSync(join(tmpdir(), "rule generation "));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  mkdirSync(join(workspace, ".claude/scripts"), { recursive: true });
  mkdirSync(join(workspace, ".claude/rules"));
  mkdirSync(join(workspace, ".agents/skills/shared"), { recursive: true });
  cpSync(join(root, ".claude/scripts/gen-rules.sh"),
    join(workspace, ".claude/scripts/gen-rules.sh"));
  symlinkSync("../.agents/skills", join(workspace, ".claude/skills"));
  writeFileSync(join(workspace, ".agents/skills/shared/POLICY.md"),
    "# Policy\n");
  for (const [skill] of rules) {
    const directory = join(workspace, ".agents/skills", skill);
    mkdirSync(join(directory, "references/nested"), { recursive: true });
    writeFileSync(join(directory, "references/GUIDE.md"),
      "# Guide\n\n[Details](nested/DETAILS.md#details)\n");
    writeFileSync(join(directory, "references/nested/DETAILS.md"),
      "# Details\n");
    writeFileSync(join(directory, "SKILL.md"),
      "---\nname: " + skill + "\ndescription: Example\nmetadata:\n" +
      "  model-tier: moderate\n---\n\n" +
      "Write safely. Read [guide](references/GUIDE.md#guide) first.\n" +
      "Read [details](./references/nested/DETAILS.md#details) next.\n" +
      "Keep [policy](../shared/POLICY.md), [web](https://example.com/doc),\n" +
      "[mail](mailto:team@example.com), and [section](#local).\n\n" +
      "## Local\n");
  }
  return workspace;
}

function generate(workspace) {
  const result = spawnSync("bash", [".claude/scripts/gen-rules.sh"], {
    cwd: workspace, encoding: "utf8", timeout: 10_000,
  });
  assert.equal(result.status, 0, result.stderr || String(result.error));
}

function ruleBody(workspace, name) {
  return readFileSync(join(workspace, ".claude/rules", name + ".md"), "utf8");
}

test("rules keep path scopes and point to canonical skill references", t => {
  const workspace = fixture(t);
  generate(workspace);
  for (const [skill, name, glob] of rules) {
    const content = ruleBody(workspace, name);
    assert.ok(content.startsWith("---\npaths:\n  - '" + glob + "'\n---\n"));
    assert.doesNotMatch(content, /^name:|^description:|^metadata:/m);
    assert.ok(content.includes(
      "[guide](../skills/" + skill + "/references/GUIDE.md#guide)"));
    assert.ok(content.includes(
      "[details](../skills/" + skill + "/references/nested/DETAILS.md#details)"));
    assert.ok(content.includes("[policy](../skills/shared/POLICY.md)"));
    assert.ok(content.includes("[web](https://example.com/doc)"));
    assert.ok(content.includes("[mail](mailto:team@example.com)"));
    assert.ok(content.includes("[section](#local)"));
  }
});

test("canonical reference links work from installed rules without copies", t => {
  const workspace = fixture(t);
  generate(workspace);
  const installed = join(workspace, "home/.claude");
  mkdirSync(installed, { recursive: true });
  cpSync(join(workspace, ".claude/rules"), join(installed, "rules"),
    { recursive: true });
  symlinkSync(join(workspace, ".agents/skills"), join(installed, "skills"));
  for (const directory of [join(workspace, ".claude/rules"),
    join(installed, "rules")]) {
    for (const [, name] of rules) {
      const file = join(directory, name + ".md");
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(/\]\(([^)]+)\)/g)) {
        const destination = match[1];
        if (destination.startsWith("#") ||
          /^[a-z][a-z\d+.-]*:/i.test(destination)) continue;
        const target = resolve(dirname(file), destination.split("#")[0]);
        assert.ok(existsSync(target), file + ": missing " + destination);
        if (destination.includes("/references/")) {
          const reference = readFileSync(target, "utf8");
          for (const child of reference.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g))
            assert.ok(existsSync(resolve(dirname(target), child[1])));
        }
      }
    }
    assert.equal(existsSync(join(directory, "references")), false);
  }
});

test("regeneration removes only legacy generated copies and is repeatable", t => {
  const workspace = fixture(t);
  const directory = join(workspace, ".claude/rules");
  writeFileSync(join(directory, "LINTER-DIRECTIVES.md"),
    "<!-- generated from .agents/skills/conventions-go/LINTER-DIRECTIVES.md — " +
    "edit there, run `make rules` -->\n\nOld generated content\n");
  writeFileSync(join(directory, "STDLIB-PREFERENCES.md"), "User-owned content\n");
  writeFileSync(join(directory, "custom.md"), "User-owned rule\n");
  generate(workspace);
  assert.equal(existsSync(join(directory, "LINTER-DIRECTIVES.md")), false);
  assert.equal(readFileSync(join(directory, "STDLIB-PREFERENCES.md"), "utf8"),
    "User-owned content\n");
  assert.equal(readFileSync(join(directory, "custom.md"), "utf8"),
    "User-owned rule\n");
  const first = rules.map(([, name]) => ruleBody(workspace, name));
  generate(workspace);
  assert.deepEqual(rules.map(([, name]) => ruleBody(workspace, name)), first);
});
