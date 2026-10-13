# Execute Assigned Work

Shared execution procedure for [`next-slice`](SKILL.md) and
[`execute-plan`](../execute-plan/SKILL.md). Work directly in the current
conversation, whether it is the user's main session or a delegated subagent
session. Do not spawn further subagents or compile another slice.

## Inputs and authority

Require a confirmed document path, selected scope, repository root,
relevant instructions, and applicable validation commands. Plan milestones
represent outcomes; compiled task IDs represent executable work.

- **Manual mode:** `next-slice` accepts either a high-level plan or a compiled
  task document. It owns confirmation, branch preparation, main-thread TDD,
  and completion. Return to its [Completion](SKILL.md#completion) afterward.
- **Coordinated mode:** the packet must name the exact task document, assigned
  task key/scope, source milestone/requirement keys, allowed files, selected
  model/effort, and recorded user authorization. Read the packet and document
  in full for context; reading the whole list does not authorize later tasks. Resolve relative
  file paths against the supplied repository root; use absolute paths for file
  tools and run shell commands from that root. If authorization, instructions,
  inputs, or a required capability are missing, return `BLOCKED` before edits.

Honor higher-priority repository rules. A coordinated packet does not bypass
permissions, PDD approvals, or a repository's per-edit approval requirement.
When those require a new decision, a coordinated subagent returns it to the
coordinator; manual execution asks the user in the main conversation.
A coordinated `mode: auto` packet carries the coordinator's recorded standing
authorization and decision IDs from
[the auto policy](../execute-plan/references/auto.md).
Do not ask again for authority that packet already supplies. Return new
ambiguity to the coordinator rather than making a worker-side design choice;
auto does not bypass a fresh-per-diff approval rule or runtime permissions.

### Manual plan input

Author tests and implementation in this main conversation when the confirmed
input is a high-level plan rather than a compiled task document. Inspect the
code, follow repository conventions, and obtain required user decisions
directly.
Manual mode does not require a separate premium coordinator or task compiler.

### Compiled task input

Follow the document's verbatim tests and implementation and its `Supports`
keys, not an assumed one-task-per-milestone mapping. Coordinated workers return
missing/invalid mappings, stale contracts, or design judgment to the premium
coordinator before edits. For legacy documents without `Supports`, the manual
main conversation derives coverage from the parent plan/spec or asks when
ambiguous; it preserves existing task IDs and verified progress.
Execute only the assigned task in coordinated mode and return before the next
task, even when more unchecked tasks are visible. The coordinator owns task
checkboxes and commits; workers report evidence without changing those markers.
Manual mode continues through the whole selected slice.

## Execute

1. Read the named instructions, context, files, conventions, and testing
   guidance. Inspect existing changes in those files and preserve them. Stay
   inside the confirmed plan/task scope and, in coordinated mode, the packet's
   allowed files. Resolve mismatches using the input-mode rules above.
2. Manual mode executes unchecked tasks top to bottom; coordinated mode
   executes its assigned task only. For code, create a stub and test according
   to the input mode, and prove the expected assertion fails before
   implementation. Compilation failure is not the red phase. For non-code
   tasks, use their runnable verification.
3. Apply or author implementation according to the input mode and run the
   task's verification. The test is the contract: correct implementation, not
   the test or its assertions. Stop after three failed correction attempts for
   the same criterion and report the unverified assumption. Material changes
   to the plan's design need user approval in manual/interactive mode;
   coordinated workers make no design decisions. An auto coordinator can resolve
   only the choices permitted by its policy and must supply the recorded choice
   in a refreshed packet before work resumes.
4. Update behavior/API/usage documentation required by the tasks. Respect the
   repository's module boundaries; apply handlers → service → repository only
   where that is its established architecture. Seed or modify living specs
   only when the required project spec and Behavioural Delta authorize it.
5. Manual mode marks compiled tasks after task checks and plan milestones
   only after verifying full outcomes/criteria, not task counts. Coordinated
   mode leaves both kinds of markers to the coordinator. Record commands,
   exit codes, and pass/fail/skipped/unavailable evidence. Report unavailable
   services, credentials, or environments rather than claiming success.
6. Run checks assigned to the task; for the slice's integration/boundary task,
   exercise the completed slice and relevant full test target, normally
   `make test`. Manual mode also runs its whole-slice completion checks.
   Separate baseline from new failures; inspect actual task changes for scope
   and regressions. Do not execute later tasks to satisfy a blocked current one.

## Coordinated return

Return `COMPLETE`, `INCOMPLETE`, or `BLOCKED`, followed by:

- Files changed, behavior delivered, and supported milestone/requirement keys
- Commands, exit codes, and real check outcomes, with evidence locations
- Deviations from verbatim code, assumptions, partial edits, and open issues
- Remaining unchecked tasks and any stop/turn-limit indication you can verify

`COMPLETE` means the assigned task's checks passed, not that the whole task
list, milestone, slice, or plan is complete. The coordinator verifies that
claim and owns its task checkbox/commit and later milestone acceptance.
In coordinated mode, leave the parent plan, project status, delivery branches,
and project README state to the coordinator. Do not commit, push, submit PRs,
deploy, publish, archive the project, or generate downstream task documents.
Preserve partial edits on failure and report them; never reset the checkout.
