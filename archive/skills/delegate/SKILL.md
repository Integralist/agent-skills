---
name: delegate
description: >-
  Hand a task to the best-matched subagent instead of doing it yourself. Use
  when the user asks to delegate a task.
disable-model-invocation: true
argument-hint: <task description>
metadata:
  model-tier: moderate
---

# Delegate to Agent

Hand the task to a subagent straight away; the subagent does the work, so
spawn it before any reads or commands of your own.

1. **Take the task** from everything the user passed. Done when you can state
   it in a sentence.
2. **Pick the subagent** by role, using your platform's actual agent names,
   and fall back to the general-purpose agent when no specialist exists:

   | Task                                | Role                        |
   | ----------------------------------- | --------------------------- |
   | Find code or files, trace deps      | Exploration                 |
   | Design an approach or architecture  | Planning                    |
   | Commands, multi-step work, refactor | General-purpose             |
   | Code review                         | Review specialist           |
   | Web research                        | Research specialist         |

   Done when the role is chosen.
3. **Spawn it** with the full task. Read-only work (find, trace, review,
   research) can go to a fire-and-forget subagent. For editing or iterative
   work, follow [SUBAGENT-STEERABILITY.md](../../../.agents/skills/shared/SUBAGENT-STEERABILITY.md):
   use a delegate the user can talk to mid-flight, or keep the work in the
   main thread, so objections don't pile up behind a large diff. Done when the
   subagent is running.
4. **Report** its results, following the shared completion and retry
   protocol if it stopped early. Done when the user has the outcome.

**Agent teams.** Where the harness supports them (see
[AGENT-TEAMS.md](../../../.agents/skills/shared/AGENT-TEAMS.md)), make an editing delegate a named
teammate: create a team `delegate-<slug>` (a 2–3 word kebab-case summary,
such as `delegate-fix-auth`) with one task and one agent assigned to it. Give
the agent the full task, the working directory, and instructions to use all
relevant tools, to update `docs/**/*.md` or `**/README.md` when behaviour,
public APIs, or usage change, and to report back to the team lead and mark
the task complete when done.
