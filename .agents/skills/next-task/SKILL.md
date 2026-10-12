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

2. **Read the file** and choose one actionable work item in document order.
   Task documents contain executable task checkboxes; plans contain milestone
   outcomes that require inline TDD decomposition, not one assumed task per
   bullet. Preserve legacy `Task N.N` plan labels as outcome keys. Respect
   Blocked-by edges and verify completed dependency outcomes. If none is
   actionable, report blockers and stop.

3. **Prepare its delivery branch.** Read `Pull Request Delivery` when present
   and map the selected task to its layer.

   - Stay on the current branch when it matches the layer's declared branch.
   - For a stack layer, invoke
     [`stacked-prs`](../stacked-prs/SKILL.md) when its branch is not current or
     the stack has not been initialized.
   - For older documents without delivery metadata, follow the existing
     single-branch workflow. Never infer one branch per task.

4. **Announce the selected task or plan outcome:**

   ```txt
   Next up: Task 2.3 — Add cache invalidation for config
   updates
   ```

5. **Execute it directly in the main thread:**

   - Write tests first (no code without a failing test).
   - Run `make test` when done.
   - Update `docs/**/*.md` or `**/README.md` if the change alters
     behavior, public APIs, or usage patterns.
   - Ensure the project `README.md` exists, creating it from
     [`../shared/PROJECT-README.md`](../shared/PROJECT-README.md) when needed.
     Keep task descriptions and checkboxes only in the task file; update the
     README only when the task artifact's document-level status changes.
   - Respect layer separation: handlers -> service -> repository.

## Completion

Once verified (tests pass, work done), mark it complete before finishing:

1. Check a compiled task after its verification. For direct plan work, check
   the selected milestone only when its full outcome and linked criteria are
   verified; leave it pending if this invocation completed only part of it.
2. If the artifact status changes, update its README row and coarse next action;
   do not copy task progress into the README.
3. For a task document's parent/subtasks, require all child checks before the
   parent. Milestones and task IDs are distinct, even if numbers match.
4. Before marking a parent-plan slice complete, verify all milestone outcomes,
   supporting task evidence, and slice boundary checks. Finishing the last task
   alone is not sufficient.
5. Report the verified work and remaining plan outcomes.
6. Ask whether to commit. If yes, invoke `/commit`.
7. Advise on next steps:
   - If a per-slice task list finished and more slices remain in the parent
     plan, suggest running `/to-tasks <plan-path> slice-<n+1>`.
   - If every task in the current PR layer is complete, ask whether to invoke
     `stacked-prs` to submit or update the stack.

## REQUIRED

- Confirm the plan choice before proceeding.
- Do the implementation work directly in the main thread — do NOT spawn
  subagents.
- Mark task or milestone checkboxes only at their own verification level.
- One selected task or plan outcome per invocation; do not advance to another
  work item.
- One task per invocation controls work scope, not PR boundaries.
- Anchor multi-turn progress and lead with state — see
  [`../shared/EXECUTIVE-SCAFFOLDING.md`](../shared/EXECUTIVE-SCAFFOLDING.md).
