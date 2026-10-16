# Task commits

How the coordinator commits each verified task and lists the commits at the
end. Workers never stage or commit. Per-task commits on the named branch are
authorized at startup, by the user's confirmation or by [`auto`](auto.md).

**Before each task,** record HEAD, branch, index, and the user's existing
changes. Give the task a stable key from the plan path, slice, and task ID, and
keep it across retries.

**Stage** only this task's inspected tests, implementation, docs, and its
checkbox and evidence update. Never use `git add .` or `-A`, and never stage the
user's changes. If unrelated work is already staged, or the task's hunks can't
be separated from the user's, stop and ask for a clean workspace. Don't stash
or reset to get around it.

**Commit** the tests and implementation together, after inspecting the whole
staged diff for scope and secrets. Write the message as the commit skill does,
from a unique message file, and add these trailers (`correction` for a later
fix, `bookkeeping` for status or evidence changes with no implementation; repeat
`Execution-Task:` for a fix that touches several tasks):

```text
Execution-Plan: projects/<date>-<slug>/plan.md
Execution-Task: slice-1/task-1
Execution-Kind: implementation
```

Never amend or squash; a later defect gets its own correction commit. A task
with no file changes records its passing evidence and `No new commit`, not an
empty commit.

After it succeeds, read the full hash and subject from Git and record them in
`execution.md`. If it fails, keep the edits and stop before the next task; once
fixed, retry the commit, not the implementation. A verified but uncommitted task
stays pending.

**Resume without repeating.** Compare `execution.md` with Git, the task list,
and the code before launching anything. Match commits by their plan, task, and
kind trailers and record any missing hash. A checkbox or trailer alone isn't
proof.

## Final review list

Build it from verified commits in Git, not from planned titles or a branch log:
leave out unrelated commits, keep every implementation and correction, and
check each hash is still reachable from the branch. Print each entry as:

```bash
git show -s --format='%h %s' <full-commit-hash>
```

Group by slice and task in time order. A commit tied to several tasks appears
under each, marked shared. List bookkeeping commits separately, and show
`No new commit` for tasks without one. Don't shorten the list, and show it on
blocked exits too, keeping verified commits apart from uncommitted partial
work.
