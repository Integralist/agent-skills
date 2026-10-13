# Task Commits and Review Index

Use this procedure only for coordinated `execute-plan` work. The premium
coordinator owns commits; implementation workers never stage or commit.
Manual `next-slice` keeps its one-commit-per-slice completion flow.

## Authorization and boundaries

In interactive mode, obtain explicit authorization for per-task commits on the
named delivery branch at startup, alongside execution/model authorization.
For `--auto`, record [the flag's standing local authority](auto.md) instead of
requesting repeat consent. Pause if required authority is missing or declined;
do not silently continue with uncommitted implementation. A main/master branch
requires explicit branch-specific confirmation in either mode. The workflow
does not authorize pushing, rebasing, resetting, or changing branches.

Before each task, record HEAD, branch, index, working-tree state, and protected
user changes. Assign a stable task key from the repository-relative plan path,
slice identifier, and task identifier; keep it unchanged across retries.
Task keys identify compiled work, not plan milestone numbers. Keep each task's
`Supports` links and milestone outcome evidence in the ledger; a task commit
alone never accepts a supported milestone. Preserve existing task keys when
refreshing coverage, including tasks whose source plan uses legacy labels.

Never stage pre-existing user changes. Stage only this task's inspected tests,
implementation, required docs, and coordinator-owned task/evidence updates.
Do not use `git add .`, `git add -A`, or whole-file staging when a file contains
unrelated user hunks. Preserve the user's index unchanged: if unrelated staged
work exists or task hunks cannot be isolated safely, stop before staging and
ask for a clean delivery workspace or explicit staging instructions. Do not
stash, reset, or commit unrelated work to clear the problem.

## Commit a verified task

1. Wait for the worker to be terminal. Inspect its actual task-only changes,
   run the required checks yourself, and resolve blocking findings. A worker's
   `COMPLETE` is not commit approval. Commit each verified task before
   dispatching the next task; tests and implementation belong in one commit.
2. Mark only the verified task checkbox and update its evidence. Stage the
   intended task hunks and inspect the entire staged diff for scope/secrets.
   Recheck HEAD/branch and protected changes; unexpected external changes
   require reconciliation, not an automatic commit.
3. Follow the repository's commit-message conventions and the
   [commit skill's message/security guidance](../../commit/SKILL.md). Use the
   consequence-focused title and a unique message file with `git commit -F`.
   Do not invoke its project archival/lifecycle steps after every task: a task
   checkpoint is not slice acceptance or whole-plan completion.
4. Include these trailers in each implementation/correction commit. Replace
   placeholders with the stable task key, relative plan path, and kind. For a
   correction affecting multiple tasks, repeat `Execution-Task:` for each.

   ```text
   Execution-Plan: projects/<date>-<slug>/plan.md
   Execution-Task: slice-1/task-1
   Execution-Kind: implementation
   ```

   Use `correction` for fixes discovered later. Record compiler/evidence/status
   changes separately as `bookkeeping` with their exact task links when they
   affect no implementation; never mislabel them as a new implementation task.
5. After success, read the full commit hash and actual subject from Git. Record
   them with task key, kind, checks, and parent HEAD in `execution.md`. That
   post-commit hash update can remain pending until the next task/bookkeeping
   commit; never create an endless sequence of commits recording their own
   hashes. On commit failure, retain edits and stop before the next task.
   In auto mode, follow the auto policy's safe recovery and retry the commit once;
   success reopens the task loop, not a bypass of the pending-commit gate.
   A verified-but-uncommitted task remains pending; after resolving the commit
   issue, retry its commit before another task, not its implementation.
   Review hook changes and rerun affected checks; do not bypass hooks.

Do not amend or squash earlier task commits. Later slice/final-review defects
get separate verified correction commits, linked to the affected task keys.
If hooks or other tools produced additional commits, inspect and index those
explicitly. Any unrelated modification blocks staging rather than expanding
scope. Verification-only tasks need no fabricated/empty implementation commit:
record their passing evidence and task-document update in a task/bookkeeping
commit when it changes files, otherwise record `No new commit` and why.

## Resume without duplicates

Compare the ledger with Git, the task document, actual code, and check evidence
before relaunching work. If a commit succeeded but its hash was not recorded,
inspect commits after the saved checkpoint and match the exact plan/task/kind
trailers. Recover the existing full hash and subject, verify its diff/checks,
and record it rather than repeating the task or commit. If a verified task has
no matching commit, reconcile its retained changes and retry the pending commit
before selecting another task. If evidence or mapping
is ambiguous, pause. A checkbox or trailer alone is not proof of acceptance.

## Final review list

Build the list from verified full commit identities in Git, not proposed titles
or a broad branch log. Exclude pre-existing/unrelated commits, retain every
implementation and later correction, and validate each recorded hash still
exists and is reachable from its recorded delivery branch. Display each entry
using its actual short hash and subject:

```bash
git show -s --format='%h %s' <full-commit-hash>
```

Group the complete list by slice and task in chronological order. A commit
linked to multiple tasks appears under each, labelled shared. List project-only
bookkeeping separately, and show `No new commit` for a verification-only task
without changes. Do not truncate the list to the usual chat brevity limit.

After whole-plan acceptance, commit remaining authorized status/evidence
bookkeeping separately if needed and include it in the report. Leave project
archival to a separately authorized lifecycle operation. Report the index on
incomplete/blocked exits too, clearly distinguishing verified task commits from
uncommitted partial work. Never push from this workflow; any separately
requested delivery operation belongs outside this execution invocation.
