---
name: delegate
description: >-
  Use when user explicitly requests agent delegation with
  /delegate. Spawns an appropriate subagent to handle the work.
user-invocable: true
argument-hint: <task description>
---

# Delegate to Agent

Delegate the task to a subagent. Do not execute work directly.

1. Parse everything after `/delegate` as the task description
2. Select a subagent role from the table below
3. Invoke the subagent immediately — no preliminary reads or
   commands
4. Report results

## Agent Selection

Route to the subagent that best matches the task. The roles
below are descriptions, not agent names — use your platform's
actual agent names.

| Task Type                          | Subagent Role                    |
| ---------------------------------- | -------------------------------- |
| Find code/files, trace deps        | Exploration / investigation      |
| Design approach, architecture      | Planning                         |
| Commands, multi-step work, refactor| General-purpose / workhorse      |
| Code review \*                     | Review specialist                |
| Web research \*                    | Research specialist               |

\* Fall back to your platform's general-purpose / workhorse
agent if no specialist is available.

## Anti-patterns

- Reading files or running commands before delegating
- "Let me quickly check..." before spawning the subagent

## Agent teams (if your harness supports it)

If your harness supports named, parallel agent teams (e.g. Claude
Code's experimental [agent teams](https://code.claude.com/docs/en/agent-teams)),
prefer spawning the delegate as a named teammate the user can chat
with directly, rather than a fire-and-forget subagent:

- Create a team named `delegate-{short-slug}` (a 2-3 word
  kebab-case summary of the task, e.g. `delegate-fix-auth`).
- Create a single task describing the work and spawn one agent
  assigned to it. The agent prompt must include the full task
  description, the working directory, and instructions to use all
  relevant tools and to update `docs/**/*.md` or `**/README.md`
  when behavior, public APIs, or usage patterns change.
- Have the agent report findings back to the team lead and mark
  the task completed when done.

On Claude Code, enable agent teams by adding the following to
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
