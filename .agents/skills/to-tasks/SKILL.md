---
name: to-tasks
description: >-
  Write a step-by-step task list from a plan file or this session's
  discussion.
disable-model-invocation: true
argument-hint: "[--plan=<path|#issue|url>] [--github] [--slice=<N>] [steering]"
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

1. **Choose the work.** Use `--plan=<path|#issue|url>` and `--slice=<N>`
   (accepted in any position), if supplied and the plan has slices. With no
   `--plan`, use the active project plan or this session's discussion. Ask if
   the source does not define enough to make tasks. For `--github` or an issue
   reference (`#<n>` or URL), read and follow
   [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and Issue
   Artifacts instead of `projects/`. Also follow it automatically when the
   project is already tracked in GitHub Issues (active in this session, named
   in `Execution-Plan: #<n>` commit trailers, or matching an open
   `project`-labelled issue when no local `projects/` folder applies).
2. **Inspect live code.** Ground every task in current code, not just plan
   wording. Load convention and testing skills for every language in the
   tasks. Know the relevant signatures, paths, and test patterns.
3. **Design the task list.** Before drafting, read
   [TASK-GUIDE.md](references/TASK-GUIDE.md) and follow its completeness, test,
   acceptance-verification, coverage, and template requirements, including its
   conditional reads.
4. **Write the file** in the plan's project folder, or create
   `projects/<yyyy-mm-dd>-<slug>/` if there is no plan. Before drafting the
   Summary, read and follow [voice-product](../voice-product/SKILL.md). Before
   adding the file to an index, read
   [PROJECTS-README.md](../shared/PROJECTS-README.md).
   Use `tasks.md` for a single-slice plan or session discussion; use
   `tasks-slice-<n>.md` for a multi-slice plan. If `tasks.md` already exists
   in that project, rename it to `tasks-slice-1.md` first. Set Status to
   `Ready`; fill Author and Created using `git config user.name` and
   `date +%F`. Write the Summary with the
   voice-product style: two or three sentences on the problem, what changes
   for whom, and why it matters. Add the task list to the project README as
   described in [PROJECTS-README.md](../shared/PROJECTS-README.md).

5. Present the compiled tasks in chat as a short list (task count, blockers,
   and the immediate first task to run).

**Done when** the task list is written and the user has its path.
