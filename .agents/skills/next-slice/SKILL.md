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
   - Do NOT mark any checkbox complete yet.
   - Respect layer separation: handlers -> service -> repository.

## Completion

Once the whole slice is verified (tests pass, every task done), mark it complete
before finishing:

1. Change each task's checkbox in the slice from `- [ ]` to `- [x]` in the plan
   file.
1. Check any parent whose subtasks are now all checked.
1. Report that the slice is done and the plan updated.
1. Ask whether to commit. If yes, invoke `/commit`.
1. If every slice in the current PR layer is complete, report that the layer is
   ready and ask whether to invoke `stacked-prs` to submit or update the stack.

## REQUIRED

- Confirm the plan choice before proceeding.
- Do the implementation work directly in the main thread — do NOT spawn
  subagents.
- When the slice is complete and verified, mark every task's checkbox `- [x]`.
- One slice per invocation. Don't chain multiple slices.
- One slice per invocation controls work scope, not PR boundaries.
