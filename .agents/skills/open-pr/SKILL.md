---
name: open-pr
description: >-
  Open a GitHub pull request for the current branch. Use when the user asks to
  create, open, or write a PR.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git branch:*), Bash(git merge-base:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr edit:*), Bash(mmdc:*)
metadata:
  model-tier: moderate
---

# Open PR

Open a ready-for-review pull request for the current branch.

1. **Check the branch.** On the default branch, ask whether to create a branch
   with the branch skill or stop. If this branch already has an open PR, ask
   whether to update its description instead. Done when you're on a feature
   branch with no open PR, or the user has chosen.

2. **Write the title and body** following
   [PR-DESCRIPTION.md](../shared/PR-DESCRIPTION.md), against the default
   branch.

3. **Get approval.** Show the title and body, then wait for the user to
   approve. Done when they approve.

4. **Open it.** If the branch has no upstream, run `git push -u origin
   <branch>`. Write the body to a temp file, then run
   `gh pr create --base <default-branch> --title "<title>" --body-file <file>`.
   Done when `gh` prints the PR URL and you've shared it.
