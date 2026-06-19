---
name: next-task
description: >-
  Continue working through a project plan. Finds the next
  unchecked task and begins implementation.
disable-model-invocation: true
---

# Next Task

Resume work from a project plan document directly in the main
thread.

## Context

- Project plans: !`find docs/plans -maxdepth 1 -name '*.md' ! -name 'README.md' -newer docs/plans/completed 2>/dev/null | head -10 || find docs/plans -maxdepth 1 -name '*.md' ! -name 'README.md' 2>/dev/null | head -10`

## Process

1. **Identify the project plan:**

   - If the user specified a plan file, use that.

   - Otherwise, look at the context above for non-completed
     plans.

   - If multiple plans exist, present the options and ask the
     user which one to use. Format as a numbered list with the
     filename.

   - **Always tell the user which plan you're going to use and
     wait for confirmation before proceeding.** Example:

     ```txt
     I'll work from docs/plans/cross-team-routing-isolation.md.
     OK, or did you have a different plan in mind?
     ```

1. **Read the plan** and find the first unchecked task
   (`- [ ]`).

1. **Announce the task** you're about to work on:

   ```txt
   Next up: Task 2.3 — Add cache invalidation for config
   updates
   ```

1. **Execute the task** directly in the main thread:

   - Write tests first (no code without a failing test)
   - Run `make test` when done
   - Update `docs/**/*.md` or `**/README.md` if the change
     alters behavior, public APIs, or usage patterns
   - Do NOT mark the checkbox as complete in the plan
   - Do NOT commit — leave that to the user
   - Respect the project's layer separation: handlers -> service
     -> repository

## Completion

Once the task is verified complete (tests pass, work done), you MUST mark
it complete in the project plan before finishing:

1. Edit the plan file and change the task's checkbox from `- [ ]` to
   `- [x]`.
1. If the plan groups subtasks under a parent task, only check the parent
   once all of its subtasks are checked.
1. Report to the user that the task is done and the plan has been updated.

## REQUIRED

- You MUST confirm the plan choice before proceeding.
- You MUST do the implementation work directly in the main thread.
  Do NOT spawn subagents.
- When the task is complete and verified, you MUST mark its checkbox as
  complete (`- [x]`) in the project plan.
- One task per invocation. Don't chain multiple tasks.
