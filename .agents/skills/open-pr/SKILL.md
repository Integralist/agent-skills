---
name: open-pr
description: >-
  Open a GitHub pull request for the current branch. Use when the user asks to
  create, open, or write a PR.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git branch:*), Bash(git merge-base:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr edit:*), Bash(mmdc:*)
metadata:
  model-tier: trivial
---

Open a ready-for-review PR for the current branch.

1. **Check the branch.** On the default branch, ask whether to create a
   branch with the branch skill or stop. If an open PR exists, ask whether to
   update its description. Continue only on a feature branch with no open PR,
   or after the user chooses.
2. **Draft the PR.** Read and follow
   [PR-DESCRIPTION.md](../shared/PR-DESCRIPTION.md), using the default branch
   as the base.
3. **Get approval.** Show the title and body, then wait for approval. Do not
   open the PR before approval.
4. **Open it.** If there's no upstream, run `git push -u origin <branch>`.
   Save the approved body to a temporary file, then run:

   ```bash
   gh pr create --base <default-branch> --title "<title>" --body-file <file>
   ```

   Share the PR URL from `gh`.
