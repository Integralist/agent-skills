---
name: acp
description: Approve the current change, commit it on the current branch, and push it to origin.
disable-model-invocation: true
metadata:
  model-tier: trivial
---

Treat `/acp` as explicit approval to apply any pending proposed change, commit
its intended files on the current branch, and push to the same branch on
`origin`. Follow [GIT-COMMIT.md](../shared/GIT-COMMIT.md) for safety, staging by
name, and Conventional Commit messages.

1. **Prepare in one turn.** Read `GIT-COMMIT.md`. Identify the current branch
   with `git symbolic-ref --quiet --short HEAD`. If no branch is checked out,
   stop and ask. Apply the proposed edit if it is not written yet, and write
   the commit-message temp file in the same turn.
   Do not run whole-file linters on untouched lines. Stop when the target files
   and message file are ready.
2. **Commit and push in one command.** Check that no secrets are included, then
   confirm the branch has not changed. If committing is unsafe or ambiguous,
   stop and ask. Leave unrelated modified files unstaged. In one `bash` call,
   stage the intended files, commit, and push with
   `git push origin "HEAD:refs/heads/$branch"`, where `branch` is the branch
   identified in step 1. Finish when that branch on `origin` has the commit.
