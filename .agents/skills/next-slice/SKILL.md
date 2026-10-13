---
name: next-slice
description: >-
  Continue working through a project plan. Finds the next
  actionable slice and implements every task in it.
disable-model-invocation: true
metadata:
  model-tier: complex
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

2. **Read the file** and select the first actionable slice in document order.
   For a plan, inspect milestone outcomes under `### Slice N:`; for a task
   document, inspect executable task checkboxes. An unchecked outcome is not
   itself a compiled task. Preserve legacy `Task N.N` plan labels as outcome
   keys rather than renaming them. Respect Blocked-by edges and verify completed
   dependency outcomes before skipping them. Flat checklists are one slice.
   If all remaining work is blocked, report its dependency and stop.

3. **Prepare its delivery branch.** Read `Pull Request Delivery` when present
   and map the selected slice to its layer.

   - Stay on the current branch when it matches the layer's declared branch.
   - For a stack layer, invoke
     [`stacked-prs`](../stacked-prs/SKILL.md) when its branch is not current or
     the stack has not been initialized.
   - For older documents without delivery metadata, follow the existing
     single-branch workflow. Never infer one branch per slice.

4. **Announce the slice:** use milestone counts for plan inputs and executable
   task counts for task documents. The example below is a task-document input:

   ```txt
   Next up: Slice 2 — Cross-team route isolation (3 tasks)
   ```

5. **Implement the selected slice directly in the main thread.** For a plan,
   derive inline TDD work from its remaining milestone outcomes and linked spec;
   for a task document, follow its actual tasks and `Supports` mapping. Read
   [the slice execution procedure](EXECUTE.md) in manual mode, supplying
   the confirmed file, selected slice, repository root, instructions, and
   validation commands. Ensure the project `README.md` exists, creating it from
   [`../shared/PROJECT-README.md`](../shared/PROJECT-README.md) when needed.
   Keep task descriptions and checkboxes only in the task file.

## Completion

Once the selected work and all slice outcomes are verified, wrap up the slice:

1. Run the full test suite (`make test`) to ensure the slice as a whole passes.
2. If the task artifact's document-level status changed, update its single
   README row and coarse next action. Do not copy task progress into the README.
3. Check parent-plan milestones only after verifying their outcome evidence,
   including linked criteria and all supporting tasks. A finished task list
   alone does not prove every milestone. Preserve legacy labels and mark the
   corresponding slice accepted only when every required outcome is verified.
4. Report that the slice is done and the plan updated.
5. Ask whether to commit. If yes, invoke `/commit`.
6. Advise on next steps:
   - If more slices remain in the parent plan, prompt to run
     `/to-tasks <plan-path> slice-<n+1>` to compile the next slice against the
     freshly updated code.
   - If every slice in the current PR layer is complete, ask whether to invoke
     `stacked-prs` to submit or update the stack.

## REQUIRED

- Confirm the plan choice before proceeding.
- Do the implementation work directly in the main thread — do NOT spawn
  subagents.
- Mark compiled task checkboxes after task verification; mark plan milestone
  checkboxes only after their outcomes are verified, never by task counts.
- Commit once for the whole slice at the end, not per task.
- One slice per invocation. Don't chain multiple slices.
- One slice per invocation controls work scope, not PR boundaries.
