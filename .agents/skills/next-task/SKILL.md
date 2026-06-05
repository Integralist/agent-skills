---
name: next-task
description: >-
  Continue working through a project plan. Finds the next
  unchecked task and begins implementation. Use when the user
  says "next task", "continue", or wants to resume project
  plan work.
argument-hint: '[--skip-agents]'
arguments:
  - name: --skip-agents
    description: Skip subagent delegation and do the work directly in the main thread
    required: false
---

# Next Task

Resume work from a project plan document using a subagent
(default) or directly in the main thread (`--skip-agents`).

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

1. **Execute the task** — choose one of two modes:

### Mode A: Subagent (default)

Spawn a single subagent (general-purpose / workhorse role).
Include in the subagent prompt:

- The full text of the task from the plan
- The plan file path for reference
- Key files mentioned in the plan relevant to this task
- Instruction to write tests first (no code without a failing
  test)
- Instruction to run `make test` when done
- Instruction to update `docs/**/*.md` or `**/README.md` if
  the change alters behavior, public APIs, or usage patterns
- Instruction to NOT mark the checkbox as complete
- Instruction to NOT commit — leave that to the user
- The project's layer separation: handlers -> service ->
  repository

Notify the user that the subagent is working.

### Mode B: Direct execution (`--skip-agents`)

Do the implementation work yourself in the main thread. Follow
the same rules the subagent would follow:

- Write tests first (no code without a failing test)
- Run `make test` when done
- Update `docs/**/*.md` or `**/README.md` if the change
  alters behavior, public APIs, or usage patterns
- Do NOT mark the checkbox as complete in the plan
- Do NOT commit — leave that to the user
- Respect the project's layer separation: handlers -> service
  -> repository

## REQUIRED

- You MUST confirm the plan choice before proceeding.
- One task per invocation. Don't chain multiple tasks.
- Subagent mode (default) delegates to a subagent. Use it when
  the task is large enough to eat into main-thread context. For
  tiny, self-contained changes, do the work inline instead — no
  need to spawn a subagent for a one-line fix.
- When delegating: you MUST spawn a subagent. You MUST NOT do
  the implementation work yourself.
- When using `--skip-agents`, you MUST do the work directly —
  do not spawn subagents.

## Agent teams (if your harness supports it)

If your harness supports named, parallel agent teams (e.g. Claude
Code's experimental [agent teams](https://code.claude.com/docs/en/agent-teams)),
the default delegation mode can run the implementation as a tracked
teammate task instead of a one-shot subagent: create a team named
`next-task-<plan-slug>`, create a task for the work item, spawn an
agent assigned to it, and have the agent report back and mark the
task completed when done.

On Claude Code, enable agent teams by adding the following to
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
