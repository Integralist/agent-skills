---
name: next-task
description: >-
  Continue working through a project plan. Finds the next
  unchecked task and begins implementation.
disable-model-invocation: true
---

# Next Task

Resume work from a project plan, in the main thread.

## Context

- Project plans: !`find docs/plans -maxdepth 1 -name '*.md' ! -name 'README.md' -newer docs/plans/completed 2>/dev/null | head -10 || find docs/plans -maxdepth 1 -name '*.md' ! -name 'README.md' 2>/dev/null | head -10`
- Task lists: !`find docs/tasks -maxdepth 1 -name '*.md' ! -name 'README.md' 2>/dev/null | head -10`

## Process

1. **Identify the plan or task list.** Use the user's file if specified;
   otherwise pick from the context above. If multiple candidates
   exist, present them as a numbered list with filenames and ask which to
   use. **Always state the file you'll use and wait for confirmation.**

   ```txt
   I'll work from docs/plans/cross-team-routing-isolation.md.
   OK, or did you have a different plan in mind?
   ```

1. **Read the file** and find the first actionable unchecked task (`- [ ]`) in
   document order. A task is actionable unless its slice's `- **Blocked by**:`
   line names a slice that still has unchecked tasks — skip a blocked task and
   keep scanning. Plans without `Blocked by` (older phase-based plans) never
   block, so the first unchecked task wins. If every remaining task is blocked,
   report which slice is next and what it waits on, then stop.

1. **Prepare its delivery branch.** Read `Pull Request Delivery` when present
   and map the selected task to its layer.

   - Stay on the current branch when it matches the layer's declared branch.
   - For a stack layer, invoke
     [`stacked-prs`](../stacked-prs/SKILL.md) when its branch is not current or
     the stack has not been initialized.
   - For older documents without delivery metadata, follow the existing
     single-branch workflow. Never infer one branch per task.

1. **Announce the task:**

   ```txt
   Next up: Task 2.3 — Add cache invalidation for config
   updates
   ```

1. **Execute it directly in the main thread:**

   - Write tests first (no code without a failing test).
   - Run `make test` when done.
   - Update `docs/**/*.md` or `**/README.md` if the change alters
     behavior, public APIs, or usage patterns.
   - Do NOT mark the checkbox complete yet.
   - Respect layer separation: handlers -> service -> repository.

## Completion

Once verified (tests pass, work done), mark it complete before finishing:

1. Change the task's checkbox from `- [ ]` to `- [x]` in the task or plan file.
1. If subtasks group under a parent, check the parent only once all its
   subtasks are checked.
1. If this was the final task in a per-slice task list
   (`docs/tasks/*-slice-<n>.md`), mark the corresponding slice complete in the
   parent plan (`docs/plans/*.md`).
1. Report that the task is done and the plan updated.
1. Ask whether to commit. If yes, invoke `/commit`.
1. Advise on next steps:
   - If a per-slice task list finished and more slices remain in the parent
     plan, suggest running `/tasks <plan-path> slice-<n+1>`.
   - If every task in the current PR layer is complete, ask whether to invoke
     `stacked-prs` to submit or update the stack.

## REQUIRED

- Confirm the plan choice before proceeding.
- Do the implementation work directly in the main thread — do NOT spawn
  subagents.
- When the task is complete and verified, mark its checkbox `- [x]`.
- One task per invocation. Don't chain multiple tasks.
- One task per invocation controls work scope, not PR boundaries.
