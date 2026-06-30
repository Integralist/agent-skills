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

## Process

1. **Identify the project plan.** Use the user's file if specified;
   otherwise pick from the context above. If multiple non-completed plans
   exist, present them as a numbered list with filenames and ask which to
   use. **Always state the plan you'll use and wait for confirmation.**

   ```txt
   I'll work from docs/plans/cross-team-routing-isolation.md.
   OK, or did you have a different plan in mind?
   ```

1. **Read the plan** and find the first unchecked task (`- [ ]`).

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

1. Change the task's checkbox from `- [ ]` to `- [x]` in the plan file.
1. If subtasks group under a parent, check the parent only once all its
   subtasks are checked.
1. Report that the task is done and the plan updated.
1. Ask whether to commit. If yes, invoke `/commit`.

## REQUIRED

- Confirm the plan choice before proceeding.
- Do the implementation work directly in the main thread — do NOT spawn
  subagents.
- When the task is complete and verified, mark its checkbox `- [x]`.
- One task per invocation. Don't chain multiple tasks.
