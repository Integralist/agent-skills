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
// Collapse whitespace so line wrapping never breaks a phrase check.
function flat(relative) {
  return read(relative).replace(/\s+/g, " ");
}
const skillPath = ".agents/skills/execute-plan/SKILL.md";
const policyPath = ".agents/skills/shared/EXECUTION-MODELS.md";
const piPath = ".agents/skills/execute-plan/references/pi-subagents.md";
const claudePath = ".agents/skills/execute-plan/references/claude-code.md";
const compilerPath = ".agents/skills/to-tasks/SKILL.md";
const executorPath = ".agents/skills/execute-plan/references/worker.md";
const agentPath = ".claude/agents/plan-executor.md";
const commitsPath = ".agents/skills/execute-plan/references/task-commits.md";
const autoPath = ".agents/skills/execute-plan/references/auto.md";
const planPath = ".agents/skills/to-plan/SKILL.md";
const buildItemPath = ".agents/skills/shared/BUILD-ITEM.md";
const acceptSlicePath = ".agents/skills/shared/ACCEPT-SLICE.md";

test("explicit invocation keeps the session model coordinating", () => {
  const content = read(skillPath);
  assert.match(content, /^name: execute-plan$/m);
  assert.match(content, /^disable-model-invocation: true$/m);
  const frontmatter = content.split("---")[1];
  assert.doesNotMatch(frontmatter, /^(model|context):/m);
  assert.match(flat(skillPath), /Coordinate from the main conversation/);
});

function assertAutoInvocation(content) {
  assert.match(content, /argument-hint: "<plan-path> \[auto\]"/);
  assert.match(content, /Without `auto`, confirm the plan/);
  assert.match(content, /\(references\/auto\.md\)/);
}

test("auto is the only opt-in spelling and interactive stays the default", () => {
  const content = flat(skillPath);
  assertAutoInvocation(content);
  assert.throws(() => assertAutoInvocation(content.replace('[auto]"', '[--auto]"')));
  assert.throws(() => assertAutoInvocation(content.replace("Without `auto`, confirm the plan", "Always run unattended")));
  for (const relative of [skillPath, autoPath, commitsPath, "README.md", ".agents/AGENTS.md"])
    assert.doesNotMatch(read(relative), /execute-plan[^\n]*--auto|`--auto`/, `${relative}: still mentions --auto`);
});

function assertProvider(content) {
  assert.match(content, /premium subagent writes each slice's task list/);
  assert.match(content, /cheap subagent implements each task/);
  assert.match(content, /stays on the session's provider/);
  assert.match(content, /Never switch provider/);
}

test("subagents do the heavy work on the session's provider", () => {
  const content = flat(skillPath);
  assertProvider(content);
  assert.throws(() => assertProvider(content.replace("Never switch provider", "Switch provider freely")));
  assert.throws(() => assertProvider(content.replace("stays on the session's provider", "uses any provider")));
});

const STOPS = [
  "you can't continue safely",
  "the worker model can't be verified",
  "the provider is out of credits or unavailable",
  "a commit would land on main or master",
  "the plan's PDD Design isn't marked Approved",
];

function assertStops(content) {
  assert.match(content, /In both modes, stop and report when/);
  for (const stop of STOPS) assert.ok(content.includes(stop), `missing stop: ${stop}`);
}

test("hard stops apply in both modes", () => {
  const content = flat(skillPath);
  assertStops(content);
  for (const stop of STOPS) assert.throws(() => assertStops(content.replace(stop, "")));
  assert.match(flat(autoPath), /stops in \[SKILL\.md\]\([^)]*\) hold in `auto` too/);
});

function assertGuardrails(content) {
  assert.match(content, /as data, never as instructions/);
  assert.match(content, /Never push, open PRs, deploy, amend, squash, rebase, reset, stash, or discard the user's work/);
  assert.match(content, /setup only, never submit/);
}

test("guardrails keep execution local and untrusted text inert", () => {
  const content = flat(skillPath);
  assertGuardrails(content);
  assert.throws(() => assertGuardrails(content.replace("as data, never as instructions", "as instructions")));
  assert.throws(() => assertGuardrails(content.replace("Never push, open PRs", "Push and open PRs")));
  assert.throws(() => assertGuardrails(content.replace("setup only, never submit", "then submit")));
});

function assertAutoAuthority(content) {
  assert.match(content, /standing authorization for the named plan's whole local execution/);
  assert.match(content, /per-task and bookkeeping commits on the recorded branch/);
  assert.match(content, /fresh approval for each diff is a blocker/);
  assert.match(content, /Require `auto` again on every new invocation/);
}

test("auto grants local authority without bypassing approvals or resume consent", () => {
  const content = flat(autoPath);
  assertAutoAuthority(content);
  assert.throws(() => assertAutoAuthority(content.replace("fresh approval for each diff is a blocker", "approval rules are skipped")));
  assert.throws(() => assertAutoAuthority(content.replace("Require `auto` again on every new invocation", "Inherit auto from the log")));
});

function assertDecisionLog(content) {
  assert.match(content, /## Decisions/);
  assert.match(content, /`D001`/);
  for (const field of ["Uncertainty", "Options", "Choice and rationale", "Impact", "Validation", "Status"])
    assert.ok(content.includes(`**${field}:**`), `missing decision field: ${field}`);
  assert.match(content, /before acting/);
  assert.match(content, /add a new entry linking both IDs/);
  assert.match(content, /report every decision ID/);
  assert.match(content, /Record user acceptance only when it actually happened/);
}

test("automatic judgments are logged, reviewable, and never labelled as user approval", () => {
  const content = flat(autoPath);
  assertDecisionLog(content);
  assert.throws(() => assertDecisionLog(content.replace("**Options:**", "**Notes:**")));
  assert.throws(() => assertDecisionLog(content.replace("before acting", "at the end")));
  assert.throws(() => assertDecisionLog(content.replace("add a new entry linking both IDs", "overwrite the entry")));
  assert.match(flat(skillPath), /decision index/);
});

function assertAutoLoop(content) {
  assert.match(content, /start the next task without asking/);
  assert.match(content, /Don't end a turn with a suggestion while authorized work remains/);
  assert.match(content, /retry the commit once without bypassing hooks/);
  assert.match(content, /The task stays pending until it succeeds/);
}

test("auto keeps going but never skips a pending commit", () => {
  const content = flat(autoPath);
  assertAutoLoop(content);
  assert.throws(() => assertAutoLoop(content.replace("retry the commit once", "retry the commit until it works")));
  assert.throws(() => assertAutoLoop(content.replace("The task stays pending until it succeeds", "Move on to the next task")));
});

function assertWorker(content) {
  assert.match(content, /Execute only the assigned task/);
  assert.match(content, /owns task checkboxes and commits/);
  assert.match(content, /decision IDs/);
  assert.match(content, /\(\.\.\/\.\.\/shared\/BUILD-ITEM\.md\)/);
}

test("the coordinator reuses the to-tasks skill and one worker procedure", () => {
  const content = flat(skillPath);
  assert.match(content, /\(\.\.\/to-tasks\/SKILL\.md\)/);
  assert.match(content, /\(references\/worker\.md\)/);
  for (const name of ["to-tasks", "next-task", "next-slice"])
    assert.match(read(`.agents/skills/${name}/SKILL.md`), /^disable-model-invocation: true$/m);
  assert.match(flat(compilerPath), /Integration \/ Boundary Verification Task/);
  const worker = flat(executorPath);
  assertWorker(worker);
  assert.throws(() => assertWorker(worker.replace("Execute only the assigned task", "Execute every task")));
});

test("manual commands build plan milestones inline through one item procedure", () => {
  for (const name of ["next-task", "next-slice"])
    assert.match(read(`.agents/skills/${name}/SKILL.md`), /\.\.\/shared\/BUILD-ITEM\.md/);
  assert.match(flat(buildItemPath), /milestone outcomes, which you break into test-first steps yourself/);
});

function assertClaudeGates(adapter, agent) {
  assert.match(adapter, /`fallbackModel`.*`--fallback-model`.*return `BLOCKED` before edits/);
  assert.match(adapter, /`subagent_type: plan-executor`/);
  assert.match(adapter, /`model` set explicitly to the premium model/);
  assert.match(adapter, /read the model and effort that ran/);
  assert.doesNotMatch(agent, /readiness|READY_ONLY/);
}

test("Claude Code blocks model overrides and verifies the model that ran", () => {
  const adapter = flat(claudePath);
  const agent = read(agentPath);
  assertClaudeGates(adapter, agent);
  assert.throws(() => assertClaudeGates(adapter.replace("return `BLOCKED` before edits", "continue"), agent));
  assert.throws(() => assertClaudeGates(adapter.replace("set explicitly to the premium model", "inherited"), agent));
  assert.throws(() => assertClaudeGates(adapter, `${agent}\nWait for a readiness packet.`));
});

test("worker preferences match native Claude configuration and Pi launch", () => {
  const policy = read(policyPath);
  const settings = JSON.parse(read(".pi/agent/settings.json"));
  const pi = policy.match(/\| Pi \+ GitHub Copilot \| [^|]+\| `([^`]+)` \|/);
  assert.ok(pi, "missing Pi Copilot worker policy");
  assert.ok(settings.enabledModels.includes(pi[1]), "Pi Copilot worker is not allowlisted");
  assert.equal(settings.modelThinkingLevels[pi[1]], "xhigh");
  const bedrock = policy.match(/\| Pi \+ Amazon Bedrock \| [^|]+\| `([^`]+)` \|/);
  assert.ok(bedrock, "missing Pi Bedrock worker policy");
  assert.ok(settings.enabledModels.includes(bedrock[1]), "Pi Bedrock worker is not allowlisted");
  const claude = policy.match(/\| Claude Code \| [^|]+\| `([^`]+)` \|/);
  assert.ok(claude, "missing Claude worker policy");
  const agent = read(agentPath);
  assert.match(agent, new RegExp(`^model: ${claude[1]}$`, "m"));
  assert.match(agent, /^effort: xhigh$/m);
  assert.doesNotMatch(agent, /^effort: max$/m);
  const launch = read(piPath);
  assert.ok(launch.includes(`"model": "${pi[1]}"`), "Pi launch example drifts from policy");
  assert.match(launch, /"thinking": "xhigh"/);
  assert.match(launch, /"allow_model_fallback": false/);
  assert.match(launch, /"edit", "write"/);
  assert.match(read(claudePath), /BLOCKED/);
  assert.match(flat(policyPath), /Never request `max`/);
});

function assertProviderFallback(policy) {
  assert.match(policy, /Change the model and effort, never the provider/);
  assert.match(policy, /\*\*Provider unavailable\.\*\* If the provider is out of credits or can't be reached, stop/);
  assert.match(policy, /ask which of the other providers in the model list to use/);
  assert.match(policy, /no row above is unmapped: stop and ask/);
}

test("switching provider is always the user's choice", () => {
  const policy = flat(policyPath);
  assertProviderFallback(policy);
  assert.throws(() => assertProviderFallback(policy.replace("never the provider", "or the provider")));
  assert.throws(() => assertProviderFallback(policy.replace("ask which of the other providers", "switch to another provider")));
});

test("the coordinator runs every slice to an audited finish", () => {
  const content = flat(skillPath);
  for (const step of [
    "1. **Set up.**",
    "2. **Get the slice's task list.**",
    "3. **Run each task**",
    "4. **Accept the slice.**",
    "5. **Audit and report.**",
  ]) assert.ok(content.includes(step), `missing step: ${step}`);
  assert.match(content, /execution\.md/);
  assert.match(content, /baseline/);
  assert.match(content, /A worker's report is a claim/);
  assert.match(content, /After three failed fixes for the same problem, stop/);
  assert.match(content, /tasks-final-verification\.md/);
  assert.match(content, /never redo a committed task/);
});

function assertTaskCommitPolicy(coordinator, worker, policy) {
  assert.match(coordinator, /Commit the task per \[task-commits\.md\]\([^)]*\) before launching the next one/);
  assert.match(worker, /Execute only the assigned task/);
  assert.match(policy, /never stage the user's changes/);
  assert.match(policy, /Execution-Task:/);
  assert.match(policy, /git show -s --format='%h %s'/);
  assert.match(policy, /`No new commit`/);
  assert.match(policy, /Never amend or squash/);
  assert.match(policy, /A verified but uncommitted task stays pending/);
}

test("task commits stay coordinator-owned and reviewable", () => {
  const coordinator = flat(skillPath);
  const worker = flat(executorPath);
  const policy = flat(commitsPath);
  assertTaskCommitPolicy(coordinator, worker, policy);
  assert.throws(() => assertTaskCommitPolicy(coordinator.replace("before launching the next one", "at the end of the slice"), worker, policy));
  assert.throws(() => assertTaskCommitPolicy(coordinator, worker.replace("Execute only the assigned task", "Execute every task"), policy));
  assert.throws(() => assertTaskCommitPolicy(coordinator, worker, policy.replace("never stage the user's changes", "stage everything")));
  assert.match(coordinator, /commits for review/);
  assert.match(flat(".agents/skills/next-slice/SKILL.md"), /Commit once for the whole slice at the end, not per task/);
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
  assert.match(scaffold, /\*\*Consumes:\*\*/);
  assert.match(scaffold, /\*\*Produces:\*\*/);
  assert.match(plan, /Plan outcomes, not steps/);
});

function assertMilestoneMapping(compiler, template) {
  assert.match(compiler, /many-to-many/);
  assert.match(compiler, /Keep milestone IDs and task IDs separate/);
  assert.match(compiler, /every unchecked milestone/);
  assert.match(template, /\*\*Supports:\*\*/);
}

test("compiled tasks map to milestones without copying the plan checklist", () => {
  const compiler = flat(compilerPath);
  const template = read(compilerPath);
  assertMilestoneMapping(compiler, template);
  assert.throws(() => assertMilestoneMapping(compiler.replace("many-to-many", "one task per milestone"), template));
  assert.throws(() => assertMilestoneMapping(compiler, template.replaceAll("**Supports:**", "**Location:**")));
});

test("planning preserves the build request and checks coverage before handoff", () => {
  const spec = flat(".agents/skills/to-spec/SKILL.md");
  const plan = flat(planPath);
  assert.match(spec, /Preserve the build request and requirement-changing clarifications in the generated `spec\.md` file's `## Development Brief` section \(see the template below\)/);
  assert.match(spec, /verbatim quotations or links to full documents at fixed revisions/);
  assert.match(spec, /Keep earlier wording and record later decisions separately; redact secrets/);
  assert.match(spec, /newly identified risks and undecided responses in Open Questions until settled/);
  assert.match(plan, /fresh read-only reviewer compare the preserved build request and clarifications with the spec and plan/);
  assert.match(plan, /Each agreed requirement must reach a verifiable milestone, linked to a spec criterion when a spec exists/);
  assert.match(plan, /disclose the limitation/);
  assert.match(plan, /Recheck only when the brief, acceptance criteria, or milestone mapping changes/);
  assert.match(flat(skillPath), /preserved build request and clarifications \(when available\) with the final code and check evidence/);
});

test("item completion requires observed evidence, not planned success", () => {
  const content = flat(buildItemPath);
  assert.match(content, /Criterion \| Check \| Command \| Result \| Evidence/);
  assert.match(content, /observed results, not planned expectations/);
  assert.match(content, /Failed, skipped, pending, unavailable, or missing required checks keep the item open/);
  assert.match(content, /Verify the whole slice against its milestones and acceptance criteria/);
  assert.match(content, /even when every task's checks pass/);
});

test("verification scope and setup let tasks finish before later milestones", () => {
  const item = flat(buildItemPath);
  assert.match(item, /Verify only this item's promised outcomes and applicable project-required checks/);
  assert.match(item, /A task may complete while its supporting milestones remain open/);
  assert.match(item, /Add missing checks or minimal harnesses for agreed behaviour within existing authorization/);
  assert.match(item, /Project rules requiring a clean suite still apply/);
  const compiler = flat(compilerPath);
  assert.match(compiler, /harness setup before the checks that need them/);
  assert.match(compiler, /Scope each task's Verify to its delivered outcome/);
  assert.match(compiler, /\.\.\/shared\/ACCEPT-SLICE\.md/);
  assert.match(flat(skillPath), /Handle pending check requests by running or delegating the checks, not repeating implementation/);
});

test("test-only delegation preserves evidence and main-thread ownership", () => {
  const content = flat(buildItemPath);
  for (const rule of [
    "Only the main conversation launches test subagents",
    "without source edits",
    "executed/skipped counts",
    "inspects the actual logs",
    "Reuse evidence for unchanged code and test setup",
    "evidence is missing or inconclusive",
  ]) assert.ok(content.includes(rule), `missing test-runner rule: ${rule}`);
  for (const name of ["next-task", "next-slice"])
    assert.match(flat(`.agents/skills/${name}/SKILL.md`), /Only test execution may be delegated/);
  assert.match(flat(skillPath), /verify the check evidence using/);
  assert.match(flat(executorPath), /Don't spawn further subagents/);
  assert.match(flat(executorPath), /Return `INCOMPLETE` with the required commands when a required run is pending/);
});

test("workers report tests that contradict agreed requirements", () => {
  const content = flat(executorPath);
  assert.match(content, /If a supplied test contradicts the agreed requirements, report the discrepancy to the coordinator/);
  assert.match(content, /Do not silently change the test or implement behaviour that contradicts those requirements/);
  assert.doesNotMatch(content, /The test is the contract/);
});

test("workers report later dependencies instead of expanding their task", () => {
  const content = flat(executorPath);
  assert.match(content, /If this task depends on unfinished later work, report the dependency to the coordinator/);
  assert.match(content, /Do not implement other tasks without authorization/);
});

test("external mocks support scoped completion without claiming live verification", () => {
  const content = flat(acceptSlicePath);
  for (const rule of [
    "do not substitute a mock for the behaviour being verified",
    "External services may be mocked where the agreed verification scope allows it",
    "Record the testing boundary and any live-service checks not performed",
    "Those checks block completion only when required by the current scope or project policy",
    "Base external test doubles on authoritative contracts or independently checked fixtures",
  ]) assert.ok(content.includes(rule), `missing mock-boundary rule: ${rule}`);
  const compiler = flat(compilerPath);
  assert.match(compiler, /Name the testing boundary and any mocked external dependencies/);
  assert.match(compiler, /state which live-service interactions the checks do not verify/);
});

test("slice acceptance excludes dependencies on undelivered changes", () => {
  assert.match(flat(acceptSlicePath), /If checks depend on local source changes excluded from delivery, rerun them without those changes before accepting the slice\./);
});

test("both slice workflows use the same outcome and boundary gate", () => {
  for (const path of [skillPath, ".agents/skills/next-slice/SKILL.md"])
    assert.match(flat(path), /\.\.\/shared\/ACCEPT-SLICE\.md/);
  const content = flat(acceptSlicePath);
  for (const rule of [
    "every milestone and acceptance criterion assigned to this slice",
    "planned later-stage checks with their owning milestones",
    "Current obligations cannot be deferred merely because their checks fail or are unavailable",
    "Run project-required checks and regression checks applicable to the change",
    "test the implementation being delivered",
    "Run acceptance scenarios assigned to this slice",
    "even when no compiled boundary task exists",
    "a complete product-wide end-to-end suite is not a prerequisite",
    "For non-code work",
    "all required checks pass",
    "Task checkboxes alone are not evidence",
    "leave the slice unaccepted",
  ]) assert.ok(content.includes(rule), `missing acceptance rule: ${rule}`);
  assert.match(flat(skillPath), /accept that residual work as a slice/);
  assert.match(flat(executorPath), /Run the task's checks and applicable project-required checks/);
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
  for (const relative of [skillPath, policyPath, piPath, claudePath, compilerPath, executorPath, agentPath, commitsPath, autoPath, planPath, buildItemPath, acceptSlicePath]) {
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
