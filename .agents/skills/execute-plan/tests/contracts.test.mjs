import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const skills = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repo = resolve(skills, "../..");
function read(relative) {
  const path = resolve(repo, relative);
  assert.ok(existsSync(path), `missing workflow artifact: ${relative}`);
  return readFileSync(path, "utf8");
}
const skillPath = ".agents/skills/execute-plan/SKILL.md";
const policyPath = ".agents/skills/shared/EXECUTION-MODELS.md";
const piPath = ".agents/skills/execute-plan/references/pi-subagents.md";
const claudePath = ".agents/skills/execute-plan/references/claude-code.md";
const compilerPath = ".agents/skills/to-tasks/COMPILE.md";
const executorPath = ".agents/skills/execute-plan/references/worker.md";
const agentPath = ".claude/agents/plan-executor.md";
const commitsPath = ".agents/skills/execute-plan/references/task-commits.md";
const autoPath = ".agents/skills/execute-plan/references/auto.md";
const planPath = ".agents/skills/to-plan/SKILL.md";
const templatePath = ".agents/skills/to-tasks/TEMPLATE.md";

test("explicit invocation leaves the selected parent model in control", () => {
  const content = read(skillPath);
  assert.match(content, /^name: execute-plan$/m);
  assert.match(content, /^disable-model-invocation: true$/m);
  const frontmatter = content.split("---")[1];
  assert.doesNotMatch(frontmatter, /^(model|context):/m);
  assert.match(content, /\/skill:execute-plan/);
  assert.match(content, /selected session model/);
  assert.match(content, /relative paths from the repository root/);
});

function assertAutoInvocation(content) {
  assert.match(content, /^argument-hint: "<plan-path> \[--auto\]"$/m);
  assert.match(content, /standalone `--auto` or `auto` before or after the path/);
  assert.match(content, /Without the flag, use interactive mode/);
  assert.match(content, /references\/auto\.md/);
  assert.match(content, /Unknown options or extra paths/);
}

test("auto is explicit, supports both aliases, and leaves interactive mode as default", () => {
  const content = read(skillPath);
  assertAutoInvocation(content);
  for (const [before, after] of [
    ["standalone `--auto` or `auto` before or after the path", "infer auto from the plan"],
    ["Without the flag, use interactive mode", "Without the flag, use auto mode"],
  ]) assert.throws(() => assertAutoInvocation(content.replace(before, after)));
});

function assertAutoAuthority(content) {
  assert.match(content, /explicit standing authorization/);
  assert.match(content, /configured worker model\/effort/);
  assert.match(content, /per-task and bookkeeping commits on the recorded branch/);
  assert.match(content, /fresh approval for each diff/);
  assert.match(content, /Never push, deploy, publish, or submit PRs/);
  assert.match(content, /Never amend, squash, rebase, reset, stash, or discard user work/);
  assert.match(content, /main\/master.*branch-specific authorization/);
  assert.match(content, /Do not inherit auto mode from `execution\.md`/);
}

test("auto grants local workflow authority without bypassing safety or resume consent", () => {
  const content = read(autoPath).replace(/\s+/g, " ");
  assertAutoAuthority(content);
  assert.throws(() => assertAutoAuthority(content.replace("Never push, deploy, publish, or submit PRs", "Push on completion")));
  assert.throws(() => assertAutoAuthority(content.replace("fresh approval for each diff", "no approval rules")));
  assert.throws(() => assertAutoAuthority(content.replace("Do not inherit auto mode from `execution.md`", "Inherit auto mode")));
});

function assertDecisionLog(content) {
  assert.match(content, /## Decisions/);
  assert.match(content, /`D001`, `D002`/);
  for (const field of ["Uncertainty", "Options", "Choice and rationale", "Impact", "Validation", "Status"])
    assert.ok(content.includes(`**${field}:**`), `missing decision field: ${field}`);
  assert.match(content, /before acting/);
  assert.match(content, /append a superseding entry/);
  assert.match(content, /every decision ID/);
  assert.match(content, /not user-approved/);
}

test("automatic judgments are durable, reviewable, and not mislabelled as user approval", () => {
  const content = read(autoPath).replace(/\s+/g, " ");
  assertDecisionLog(content);
  assert.throws(() => assertDecisionLog(content.replace("**Options:**", "**Notes:**")));
  assert.throws(() => assertDecisionLog(content.replace("before acting", "at the end")));
  assert.throws(() => assertDecisionLog(content.replace("append a superseding entry", "overwrite history")));
  assert.match(read(skillPath), /Decisions for review/);
});

function assertAutoLoop(content) {
  assert.match(content, /Do not end a turn with a next-task suggestion/);
  assert.match(content, /original-plan\/spec audit/);
  assert.match(content, /residual verification\/documentation tasks/);
  assert.match(content, /configured worker becomes unavailable/);
  assert.match(content, /required evidence is unavailable/);
  assert.match(content, /three corrections for one criterion/);
  assert.match(content, /retry the commit once/);
  assert.match(content, /Preserve explicit requirements, acceptance criteria, exact interfaces/);
  assert.match(content, /independent tasks or slices/);
}

test("auto continues through final residual work but cannot invent acceptance or evade retry limits", () => {
  const content = read(autoPath).replace(/\s+/g, " ");
  assertAutoLoop(content);
  assert.throws(() => assertAutoLoop(content.replace("required evidence is unavailable", "treat unavailable evidence as passing")));
  assert.throws(() => assertAutoLoop(content.replace("three corrections for one criterion", "unlimited corrections")));
  assert.throws(() => assertAutoLoop(content.replace("Preserve explicit requirements, acceptance criteria, exact interfaces", "Relax the contract")));
});

test("compiler, executor, adapters and commits carry auto authority without changing manual workflows", () => {
  for (const relative of [compilerPath, executorPath, commitsPath, piPath, claudePath])
    assert.match(read(relative), /auto/, `${relative}: missing auto handoff`);
  assert.match(read(compilerPath), /coordinator.*auto/s);
  assert.match(read(executorPath), /decision IDs/);
  assert.match(read(commitsPath), /retry.*once/s);
  assert.match(read("README.md"), /--auto/);
});

test("manual commands and coordinator share one compiler and executor", () => {
  const content = read(skillPath);
  assert.match(content, /to-tasks\/COMPILE\.md/);
  assert.match(content, /references\/worker\.md/);
  for (const name of ["to-tasks", "next-slice"]) {
    assert.match(read(`.agents/skills/${name}/SKILL.md`), /^disable-model-invocation: true$/m);
  }
  assert.match(read(".agents/skills/to-tasks/SKILL.md"), /\(COMPILE\.md\)/);
  assert.match(read(compilerPath), /Integration \/ Boundary Verification Task/);
  assert.match(read(executorPath), /coordinated/);
  assert.match(read(executorPath), /parent plan/);
});

test("manual commands build plan milestones inline through one item procedure", () => {
  for (const name of ["next-task", "next-slice"])
    assert.match(read(`.agents/skills/${name}/SKILL.md`), /\.\.\/shared\/BUILD-ITEM\.md/);
  assert.match(read(".agents/skills/shared/BUILD-ITEM.md"), /milestone outcomes, which you break into\s+test-first steps yourself/);
});

function assertClaudeReadiness(adapter, agent) {
  const readiness = adapter.indexOf("`stage: readiness`");
  const execute = adapter.indexOf("`stage: execute`");
  assert.ok(readiness >= 0 && execute > readiness, "Claude must verify readiness before implementation");
  assert.match(agent, /Make no edits\. Await a resumed `execute` packet with\s+recorded user authorization and coordinator-verified model\/effort evidence\./);
}

test("Claude readiness and authorization gates detect removal or premature execute", () => {
  const adapter = read(claudePath);
  const agent = read(agentPath);
  assertClaudeReadiness(adapter, agent);
  assert.match(adapter, /`fallbackModel`[\s\S]*`--fallback-model`[\s\S]*return `BLOCKED` before edits/);
  assert.throws(() => assertClaudeReadiness(adapter.replace("`stage: readiness`", "`stage: execute`"), agent));
  assert.throws(() => assertClaudeReadiness(adapter, agent.replace("Make no edits.", "Implement immediately.")));
  assert.throws(() => assertClaudeReadiness(adapter, agent.replace("recorded user authorization", "implicit authorization")));
});

test("worker preferences match native Claude configuration and Pi launch", () => {
  const policy = read(policyPath);
  const pi = policy.match(/\| Pi \+ GitHub Copilot \| `([^`]+)` \|/);
  assert.ok(pi, "missing Pi worker policy");
  const settings = JSON.parse(read(".pi/agent/settings.json"));
  assert.ok(settings.enabledModels.includes(pi[1]), "Pi worker is not allowlisted");
  assert.equal(settings.modelThinkingLevels[pi[1]], "xhigh");
  const claude = policy.match(/\| Claude Code \| `([^`]+)` \|/);
  assert.ok(claude, "missing Claude worker policy");
  const agent = read(agentPath);
  assert.match(agent, new RegExp(`^model: ${claude[1]}$`, "m"));
  assert.match(agent, /^effort: xhigh$/m);
  assert.doesNotMatch(agent, /^effort: max$/m);
  assert.ok(read(piPath).includes(`"model": "${pi[1]}"`), "Pi launch example drifts from policy");
  assert.match(read(piPath), /"thinking": "xhigh"/);
  assert.match(read(piPath), /"allow_model_fallback": false/);
  assert.match(read(piPath), /"edit", "write"/);
  assert.match(read(claudePath), /BLOCKED/);
  assert.match(policy, /Never request\s+`max`/);
});

test("the coordinator contains review, correction, resume and whole-plan gates", () => {
  const content = read(skillPath);
  for (const heading of [
    "## 1. Establish context and authorization",
    "## 2. Compile only the next actionable slice",
    "## 3. Delegate one bounded task",
    "## 4. Verify and commit each task, then accept the slice",
    "## 5. Audit the whole plan and report",
  ]) assert.ok(content.includes(heading), `missing execution gate: ${heading}`);
  assert.match(content, /execution\.md/);
  assert.match(content, /baseline/);
  assert.match(content, /original plan/);
  assert.match(content, /three\s+correction\s+attempts/);
  assert.match(content, /pre-existing/);
  assert.match(content, /pass, fail, skipped, and unavailable/);
});

test("unsliced requirements have a bounded execution route after slices end", () => {
  assert.match(read(skillPath), /tasks-final-verification\.md/);
  assert.match(read(skillPath), /return directly to Step 5/);
  assert.match(read(compilerPath), /tasks-final-verification\.md/);
});

function assertTaskCommitPolicy(coordinator, executor, policy) {
  assert.match(coordinator, /task-commits\.md/);
  assert.match(coordinator, /explicit authorization for\s+per-task commits/);
  assert.match(coordinator, /Commit each verified task before dispatching the next task/);
  assert.match(executor, /Execute only the assigned task/);
  assert.match(executor, /coordinator owns task\s+checkboxes and commits/);
  assert.match(policy, /Never stage pre-existing user changes/);
  assert.match(policy, /Execution-Task:/);
  assert.match(policy, /git show -s --format='%h %s'/);
  assert.match(policy, /verification-only tasks/i);
  assert.match(policy, /Do not amend or squash/);
  assert.match(policy, /verified-but-uncommitted task remains pending/);
}

test("task commits stay coordinator-owned, authorized, and reviewable", () => {
  const coordinator = read(skillPath);
  const executor = read(executorPath);
  const policy = read(commitsPath);
  assertTaskCommitPolicy(coordinator, executor, policy);
  assert.throws(() => assertTaskCommitPolicy(coordinator.replace(/explicit authorization for\s+per-task commits/, "implicit commit permission"), executor, policy));
  assert.throws(() => assertTaskCommitPolicy(coordinator.replace("Commit each verified task before dispatching the next task", "Commit the completed slice"), executor, policy));
  assert.throws(() => assertTaskCommitPolicy(coordinator, executor.replace("Execute only the assigned task", "Execute every task"), policy));
  assert.throws(() => assertTaskCommitPolicy(coordinator, executor, policy.replace("Never stage pre-existing user changes", "Stage all changes")));
  assert.match(coordinator, /Commits for review/);
  assert.match(read(".agents/skills/next-slice/SKILL.md"), /Commit once for the whole slice at the end, not per task/);
});

test("documented Git commands recover task/correction records and actual review titles", () => {
  const scratch = mkdtempSync(join(tmpdir(), "task-commit-contract-"));
  const working = join(scratch, "repo");
  function git(...args) {
    const result = spawnSync("git", ["-C", working, ...args], {
      encoding: "utf8",
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" },
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  }
  try {
    const init = spawnSync("git", ["init", "--quiet", working], { encoding: "utf8" });
    assert.equal(init.status, 0, init.stderr);
    git("config", "user.name", "Fixture");
    git("config", "user.email", "fixture@example.invalid");
    git("config", "commit.gpgsign", "false");
    git("config", "core.hooksPath", "/dev/null");
    git("checkout", "-b", "feature/demo");
    const plan = "projects/demo/plan.md";
    function commit(title, task, kind, text) {
      writeFileSync(join(working, "task.txt"), text);
      git("add", "task.txt");
      const message = [title, "", `Execution-Plan: ${plan}`, `Execution-Task: ${task}`, `Execution-Kind: ${kind}`, ""].join("\n");
      const messagePath = join(scratch, "message.txt");
      writeFileSync(messagePath, message);
      git("commit", "--quiet", "-F", messagePath);
      return git("rev-parse", "HEAD");
    }
    const implementation = commit("feat(task): preserve valid input", "slice-1/task-1", "implementation", "original\n");
    const boundary = commit("test(task): cover its boundary", "slice-1/task-2", "implementation", "boundary\n");
    const correction = commit("fix(task): preserve empty input", "slice-1/task-1", "correction", "corrected\n");
    writeFileSync(join(working, "personal.txt"), "user patch\n");
    git("add", "personal.txt");
    git("commit", "--quiet", "-m", "docs(personal): keep user notes");
    const before = git("rev-list", "--count", "HEAD");
    const taskRecords = git("log", "--reverse", "--format=%H%x00%B%x00").split("\0")
      .map((value) => value.trim());
    const recovered = [];
    for (let index = 0; index + 1 < taskRecords.length; index += 2) {
      const [hash, message] = taskRecords.slice(index, index + 2);
      if (!message.includes(`Execution-Plan: ${plan}\n`)) continue;
      const task = message.match(/^Execution-Task: (.+)$/m)?.[1];
      const kind = message.match(/^Execution-Kind: (.+)$/m)?.[1];
      recovered.push({ hash, task, kind });
    }
    assert.deepEqual(recovered.map(({ hash, task, kind }) => [hash, task, kind]), [
      [implementation, "slice-1/task-1", "implementation"],
      [boundary, "slice-1/task-2", "implementation"],
      [correction, "slice-1/task-1", "correction"],
    ]);
    const format = read(commitsPath).match(/git show -s --format='([^']+)'/);
    assert.ok(format, "review formatting command missing");
    const taskOne = recovered.filter((record) => record.task === "slice-1/task-1");
    const titles = taskOne.map((record) => git("show", "-s", `--format=${format[1]}`, record.hash));
    assert.deepEqual(titles, [
      `${git("rev-parse", "--short", implementation)} feat(task): preserve valid input`,
      `${git("rev-parse", "--short", correction)} fix(task): preserve empty input`,
    ]);
    assert.equal(git("rev-list", "--count", "HEAD"), before, "index/review must not create duplicate commits");
    assert.equal(git("status", "--porcelain"), "");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("new plans use outcome milestones while keeping exact interfaces", () => {
  const plan = read(planPath);
  const scaffold = plan.split("````markdown\n")[1]?.split("````")[0];
  assert.ok(scaffold, "plan scaffold missing");
  assert.match(scaffold, /#### Slice 1 Milestones/);
  assert.match(scaffold, /\*\*M1\.1\*\*/);
  assert.match(scaffold, /#### Slice 2 Milestones/);
  assert.doesNotMatch(scaffold, /^- \[ \] \*\*Task \d/m);
  assert.match(scaffold, /\*\*Consumes\*\*/);
  assert.match(scaffold, /\*\*Produces\*\*/);
  assert.match(plan, /implementation details belong in the task document/);
});

function assertMilestoneMapping(compiler, template) {
  assert.match(compiler, /many-to-many/);
  assert.match(compiler, /Keep milestone IDs and task IDs separate/);
  assert.match(compiler, /every unchecked milestone/);
  assert.match(template, /\*\*Supports:\*\*/);
  assert.match(template, /## Milestone coverage/);
}

test("compiled tasks map to milestones without copying the plan checklist", () => {
  const compiler = read(compilerPath);
  const template = read(templatePath);
  assertMilestoneMapping(compiler, template);
  assert.throws(() => assertMilestoneMapping(compiler.replace("many-to-many", "one task per milestone"), template));
  assert.throws(() => assertMilestoneMapping(compiler, template.replaceAll("**Supports:**", "**Location:**")));
});

test("milestone acceptance requires outcome evidence and preserves legacy resume", () => {
  const coordinator = read(skillPath);
  assert.match(coordinator, /A task commit does not complete a milestone/);
  assert.match(coordinator, /legacy `Task N\.N` plan checkboxes/);
  assert.match(coordinator, /never renumber/);
  assert.match(read(".agents/skills/next-slice/SKILL.md"), /milestone outcome/);
});

function stripFences(content) {
  const kept = [];
  let fence;
  for (const line of content.split("\n")) {
    if (fence) {
      const closing = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/)?.[1];
      if (closing?.[0] === fence[0] && closing.length >= fence.length) fence = undefined;
      continue;
    }
    const opening = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
    if (opening) fence = opening;
    else kept.push(line);
  }
  return kept.join("\n");
}

test("reference checking ignores nested examples but keeps real instruction links", () => {
  const nested = "keep\n````markdown\n[template](./spec.md)\n```go\ncode\n```\n````\n[real](./SKILL.md)";
  assert.equal(stripFences(nested), "keep\n[real](./SKILL.md)");
  assert.equal(stripFences("inline ` ```gherkin `\n[real](./SKILL.md)"), "inline ` ```gherkin `\n[real](./SKILL.md)");
  assert.equal(stripFences("~~~text\n[example](missing.md)\n~~~~\nreal"), "real");
});

test("workflow references resolve without private checkout links", () => {
  for (const relative of [skillPath, policyPath, piPath, claudePath, compilerPath, executorPath, agentPath, commitsPath, autoPath, planPath, templatePath]) {
    const content = stripFences(read(relative));
    assert.doesNotMatch(content, /\/(?:Users|home)\/[^/\s]+\/|\.\.\/pi-subagents\//);
    for (const match of content.matchAll(/\]\(([^\s)]+)\)/g)) {
      const [target, fragment] = match[1].split("#");
      if (/^https?:/.test(target)) continue;
      const destination = target ? resolve(dirname(resolve(repo, relative)), target) : resolve(repo, relative);
      assert.ok(existsSync(destination), `${relative}: broken link ${target}`);
      if (fragment && destination.endsWith(".md")) {
        const headings = [...readFileSync(destination, "utf8").matchAll(/^#{1,6}\s+(.+)$/gm)]
          .map((heading) => heading[1].toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s+/g, "-"));
        assert.ok(headings.includes(fragment), `${relative}: broken heading ${match[1]}`);
      }
    }
  }
});
