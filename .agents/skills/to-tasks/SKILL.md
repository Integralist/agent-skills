---
name: to-tasks
description: >-
  Write a step-by-step task list from a plan file or this session's
  discussion.
disable-model-invocation: true
argument-hint: "[plan path] [slice-N]"
metadata:
  model-tier: complex
---

Turn a plan or this session's discussion into a task list a less capable agent
can implement without design choices. Walk the code once so the executor
doesn't have to. The list supplies verbatim tests that fix the contract,
precise implementation guidance, and a runnable check for each task. Write the
list; leave implementation and test execution to the executor. The tests are
its gate, and implementing the code yourself would pay for the work twice.

**Stop and ask.** Follow the source as given. If something is missing,
contradictory, or points to a wrong design, tell the user and wait. Do not fill
gaps with guesses.

**Workflow.**

1. **Choose the work.** Use the named plan and `slice-N`, if supplied and the
   plan has slices. With no file, use this session's discussion. Ask if the
   source does not define enough to make tasks.
2. **Inspect live code.** Ground every task in current code, not just plan
   wording. Load convention and testing skills for every language in the
   tasks. Know the relevant signatures, paths, and test patterns.
3. **Design the task list.** Before drafting, read
   [TASK-GUIDE.md](references/TASK-GUIDE.md) and follow its completeness, test,
   acceptance-verification, coverage, and template requirements, including its
   conditional reads.
4. **Write the file** in the plan's project folder, or create
   `projects/<yyyy-mm-dd>-<slug>/` if there is no plan. Before drafting the
   Summary, read [voice-product](../voice-product/SKILL.md). Before adding the
   file to an index, read [PROJECTS-README.md](../shared/PROJECTS-README.md).
   Use `tasks.md` for a single-slice plan or session discussion; use
   `tasks-slice-<n>.md` for a multi-slice plan. If `tasks.md` already exists
   in that project, rename it to `tasks-slice-1.md` first. Set Status to
   `Ready`; fill Author and Created using `git config user.name` and
   `date +%F`. Write the Summary with the
   voice-product style: two or three sentences on the problem, what changes
   for whom, and why it matters. Add the task list to the project README as
   described in [PROJECTS-README.md](../shared/PROJECTS-README.md).

**Done when** the task list is written and the user has its path.
