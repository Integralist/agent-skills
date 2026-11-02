---
name: acp
description: Approve the current change, commit it to main, and push it to origin.
disable-model-invocation: true
metadata:
  model-tier: trivial
---

Treat `/acp` as explicit approval to apply any pending proposed change, commit
its intended files on `main`, and push them to `origin/main` in as few turns as
possible. Follow [GIT-COMMIT.md](../shared/GIT-COMMIT.md) for safety, staging by
name, and Conventional Commit messages.

1. **Prepare in one turn.** Read `GIT-COMMIT.md`. Apply the proposed edit if it
   is not written yet, and write the commit-message temp file in the same turn.
   Do not run whole-file linters on untouched lines. Stop when the target files
   and message file are ready.
2. **Commit and push in one command.** Check that no secrets are included, then
   run `git add <files> && git commit -F <msg-file> && git push origin main` in
   one `bash` call. Leave unrelated modified files unstaged. If committing to
   `main` is unsafe or ambiguous, stop and ask. Finish when `origin/main` has
   the commit.
