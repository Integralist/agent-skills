---
name: next-slice
description: >-
  Continue working through a project plan. Finds the next
  actionable slice and implements every task in it.
disable-model-invocation: true
---

# Next Slice

Resume work from a project plan, in the main thread, one whole slice
per invocation.

## Context

- Projects & tasks: !`find projects -maxdepth 2 -name '*.md' ! -path '*/completed/*' ! -name 'README.md' 2>/dev/null | head -15 || find docs/plans -maxdepth 1 -name '*.md' ! -name 'README.md' 2>/dev/null | head -10`

## Process

1. **Identify the plan or task list.** Use the user's file if specified;
   otherwise pick from the context above. If multiple candidates
   exist, present them as a numbered list with filenames and ask which to
   use. **Always state the file you'll use and wait for confirmation.**

   ```txt
   I'll work from projects/2026-02-27-cross-team-routing-isolation/plan.md.
   OK, or did you have a different plan in mind?
   ```

1. **Read the file** and find the first actionable slice (a `### Slice N:`
   heading with at least one unchecked task `- [ ]`) in document order. A slice
   is actionable unless its `- **Blocked by**:` line names a slice that still has
   unchecked tasks — skip a blocked slice and keep scanning. Plans without
   `Blocked by` (older phase-based plans) never block, so the first slice with an
   unchecked task wins. A flat task list with no `### Slice` headings is treated
   as a single slice — take all its actionable unchecked tasks. If every
   remaining slice is blocked, report which slice is next and what it waits on,
   then stop.

1. **Prepare its delivery branch.** Read `Pull Request Delivery` when present
   and map the selected slice to its layer.

   - Stay on the current branch when it matches the layer's declared branch.
   - For a stack layer, invoke
     [`stacked-prs`](../stacked-prs/SKILL.md) when its branch is not current or
     the stack has not been initialized.
   - For older documents without delivery metadata, follow the existing
     single-branch workflow. Never infer one branch per slice.

1. **Announce the slice:**

   ```txt
   Next up: Slice 2 — Cross-team route isolation (3 tasks)
   ```

1. **Execute every unchecked task in the slice directly in the main thread,** in
   document order:

   - Write tests first (no code without a failing test).
   - Run `make test` when done.
   - Update `docs/**/*.md` or `**/README.md` if the change alters
     behavior, public APIs, or usage patterns.
   - Mark the task's checkbox `- [x]` as soon as verified (and check any parent
     whose subtasks are now all checked), before moving to the next task.
   - Respect layer separation: handlers -> service -> repository.

## Completion

Once all tasks in the slice are verified, wrap up the slice:

1. Run the full test suite (`make test`) to ensure the slice as a whole passes.
1. If working from a per-slice task list (`projects/<slug>/tasks-slice-<n>.md`),
   mark the corresponding slice complete in the parent plan
   (`projects/<slug>/plan.md`).
1. Report that the slice is done and the plan updated.
1. Ask whether to commit. If yes, invoke `/commit`.
1. Advise on next steps:
   - If more slices remain in the parent plan, prompt to run
     `/to-tasks <plan-path> slice-<n+1>` to compile the next slice against the
     freshly updated code.
   - If every slice in the current PR layer is complete, ask whether to invoke
     `stacked-prs` to submit or update the stack.

## REQUIRED

- Confirm the plan choice before proceeding.
- Do the implementation work directly in the main thread — do NOT spawn
  subagents.
- Mark each task's checkbox `- [x]` as soon as it is verified, before moving to
  the next task.
- Commit once for the whole slice at the end, not per task.
- One slice per invocation. Don't chain multiple slices.
- One slice per invocation controls work scope, not PR boundaries.
