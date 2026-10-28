# Worker procedure

How a worker implements one task for [`execute-plan`](../SKILL.md). Work in the
delegated subagent session. Don't spawn further subagents, write another
slice's task list, or switch model or effort.

**Packet.** It must name the repository root, the task list, the one assigned
task, its source milestone keys, the allowed files, the model and effort, and
the recorded authorization. Read the packet and the whole list for context;
reading the list doesn't authorize later tasks. Use absolute paths for file
tools and run shell commands from the root. If anything is missing, return
`BLOCKED` before editing.

Repository rules and permissions still apply, and so do any per-edit approval
and PDD gates. When one needs a new decision, return it to the coordinator. In
`auto` the packet carries the standing authorization and decision IDs from
[auto.md](auto.md), so don't ask again; return new ambiguity instead of making
a design choice.

**Do the task.** Execute only the assigned task and return before the next one,
even if more unchecked tasks are visible.

1. Inspect the existing changes in the files you'll touch and keep them.
2. Follow the task's tests, and any code it gives, as written, and implement
   the rest from its description, building it as
   [BUILD-ITEM.md](../../shared/BUILD-ITEM.md) describes, except that the
   coordinator owns ticking boxes. Prove the test fails on its assertion, not on
   a compile error, then make it pass. For a task with no code, use its runnable
   check. The test is the contract: fix the implementation, never the test.
3. Stop after three failed fixes for the same criterion and report the
   assumption you couldn't verify. Make no design decisions.
4. Update the docs the task requires. Change a living spec only when the project
   spec and its Behavioural Delta authorize it.
5. Run the task's checks and applicable project-required checks, using
   documented commands. For lengthy or noisy non-unit checks, you may request
   a coordinator-run check instead. Return `INCOMPLETE` with the
   required commands when a required run is pending. Separate baseline
   failures from new ones, and check your changes for scope and regressions.
   If this task depends on unfinished later work, report the dependency to the
   coordinator. Do not implement other tasks without authorization.

**Leave to the coordinator:** checkboxes, staging, commits, branches, the
parent plan, and project status. Don't commit, push, submit PRs, deploy,
publish, archive, or write downstream task lists. On failure, keep partial edits
and report them; never reset the checkout.

**Return** `COMPLETE`, `INCOMPLETE`, or `BLOCKED`, then:

- files changed, behaviour delivered, and the milestone keys supported;
- commands, exit codes, and real check outcomes, noting unavailable services;
- deviations from the task's code, assumptions, partial edits, open issues;
- remaining unchecked tasks.

`COMPLETE` means this task's checks passed, not that the list, slice, or plan
is done. The coordinator verifies that and owns task checkboxes and commits.
