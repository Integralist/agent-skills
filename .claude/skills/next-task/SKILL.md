---
name: next-task
description: Continue working through a project plan. Finds the next unchecked task and begins implementation in a background agent. Use when the user says "next task", "continue", or wants to resume project plan work.
---

# Next Task

Resume work from a project plan document using a background agent.

## Context

- Project plans: !`find docs/projects -maxdepth 1 -name '*.md' ! -name 'README.md' -newer docs/projects/completed 2>/dev/null | head -10 || find docs/projects -maxdepth 1 -name '*.md' ! -name 'README.md' 2>/dev/null | head -10`

## Process

1. **Identify the project plan:**

   - If the user specified a plan file, use that.
   - Otherwise, look at the context above for non-completed plans.
   - If multiple plans exist, present the options and ask the user
     which one to use. Format as a numbered list with the filename.
   - **Always tell the user which plan you're going to use and wait
     for confirmation before spawning the agent.** Example:

     ```text
     I'll work from docs/projects/cross-team-routing-isolation.md.
     OK, or did you have a different plan in mind?
     ```

2. **Read the plan** and find the first unchecked task (`- [ ]`).

3. **Announce the task** you're about to delegate:

   ```text
   Next up: Task 2.3 — Add cache invalidation for config updates
   Spawning a background agent to work on this.
   ```

4. **Spawn a background agent** using the Agent tool with
   `run_in_background: true`. Include in the agent prompt:

   - The full text of the task from the plan
   - The plan file path for reference
   - Key files mentioned in the plan relevant to this task
   - Instruction to write tests first (no code without a failing
     test)
   - Instruction to run `make test` when done
   - Instruction to NOT mark the checkbox as complete
   - Instruction to NOT commit — leave that to the user
   - The project's layer separation: handlers -> service ->
     repository

5. **Return control** to the user immediately. They will be
   notified when the agent finishes.

## REQUIRED

- You MUST use the Agent tool with `run_in_background: true`.
- You MUST confirm the plan choice before spawning.
- You MUST NOT do the implementation work yourself.
- One task per invocation. Don't chain multiple tasks.
