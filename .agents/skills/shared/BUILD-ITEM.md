# Build one item

How to build one item from a plan or task list and tick it off. A task list
holds exact tasks; a plan holds milestone outcomes, which you break into
test-first steps yourself.

**Scope.** Verify only this item's promised outcomes and applicable
project-required checks. A task may complete while its supporting milestones
remain open; later-stage checks stay with their owning milestones.

**Build it test-first.** Write a failing test and run it. It must fail on its
assertion; a compile error doesn't count. Then make it pass and tidy up. When a
task gives you a test or code, follow it as written. Never weaken a test
to make it pass. Run the applicable checks, and update docs when behaviour or
usage changes.

**Run checks efficiently.** Keep short checks inline. For lengthy or noisy
non-unit checks, prefer a test-only subagent when supported, or a background
process with saved logs. Only the main conversation launches test subagents;
implementation workers may request a coordinator-run check. Give the runner
the commands, scope, expected scenarios, and log path. Keep tested source
unchanged during a run and use isolated test resources.

The runner executes checks without source edits and returns commands, exit
codes, executed/skipped counts (or unavailable), failures, and log paths.
Follow [SUBAGENT-STEERABILITY.md](SUBAGENT-STEERABILITY.md) for completion
handling. The main agent inspects the actual logs and confirms the intended
checks ran; it diagnoses failures and owns acceptance. Reuse evidence for
unchanged code and test setup. Rerun affected checks after changes, or when
evidence is missing or inconclusive.

**Close routine gaps.** Add missing checks or minimal harnesses for agreed
behaviour within existing authorization. Escalate scope or design changes,
missing access, and required approvals; delegated workers report these to the
coordinator. A pending coordinator-run check needs execution, not another
implementation attempt or a user decision.

**Record evidence.** Keep one row per promised outcome beside the item. Use
its existing source reference; delegated workers return the rows for the
coordinator to record. Capture observed results, not planned expectations;
reference shared results instead of repeating logs.

````md
| Criterion | Check | Command | Result | Evidence |
| --- | --- | --- | --- | --- |
| {source item} | {test/assertion} | `{command}` | {status} | {output/log} |
````

Failed, skipped, pending, unavailable, or missing required checks keep the item
open. Report pre-existing failures separately, without treating a failing
suite as passing or expanding this task to fix unrelated failures. Project
rules requiring a clean suite still apply.

**Accepting a slice.** Verify the whole slice against its milestones and
acceptance criteria, even when every task's checks pass.

**Tick it off** only when its own outcome has passing evidence: a milestone
when its whole outcome is met, not after one task towards it, and a parent only
after all its children. If the project's status changed, update its README as
[PROJECTS-README.md](PROJECTS-README.md) describes.
