---
name: worktree-cleanup
description: >-
  Remove stale worktrees and branches for merged PRs, prune remotes, and
  rebase the base branch. Use when the user asks to clean up worktrees,
  remove stale branches for merged PRs, or after merging a PR from a
  worktree.
argument-hint: "[pr-url | #<pr-number>]"
allowed-tools: Bash(gh pr list:*), Bash(gh pr view:*), Bash(git log:*), Bash(git status:*), Bash(git worktree list:*)
metadata:
  model-tier: trivial
---

Clean up local Git worktrees and branches whose PRs are merged, prune
remotes, and rebase the base branch onto `origin/<base>`.

Always run from the repository's main checkout, not inside a worktree being
removed.

## Single-PR mode (`<pr-url | #<pr-number>>`)

1. **Verify the PR.** Run
   `gh pr view <pr> --json state,headRefName,baseRefName,mergedAt,url`. If
   `state` is not `MERGED`, report it and stop without deleting work.
2. **Check the worktree.** Run `git worktree list` and match `headRefName`. If
   found, run `git -C <path> status --short --branch`; stop and ask if
   uncommitted or untracked files exist. If absent, continue.
3. **Remove and prune.** Run `git worktree remove <path>` and
   `git fetch origin --prune`.
4. **Delete the local branch.** Run `git branch -d <headRefName>`. Fall back
   to `git branch -D <headRefName>` only after confirming `MERGED` status in
   step 1 and a clean worktree in step 2. Skip if absent locally.
5. **Rebase the base branch.** Proceed to [Finish](#finish) with
   `baseRefName`.

## Audit mode (no argument)

1. **Inspect all worktrees.** Run `git worktree list` and
   `git status --short --branch`.
2. **Classify each non-main worktree.** Note `prunable` entries (missing
   directory). For each remaining worktree, check
   `git -C <path> status --short --branch` and, if on a branch,
   `gh pr list --head <branch> --state all --json number,state,url`. Flag
   `prunable` entries and clean `MERGED` PR worktrees as safe to remove; keep
   worktrees with uncommitted changes, detached HEADs without a PR, and
   `OPEN`/`CLOSED`-unmerged branches unless explicitly approved.
3. **Confirm before deleting.** Present the list (path, branch, PR state,
   clean or uncommitted) and wait for approval on which entries to remove.
4. **Clean up approved entries.** Run `git worktree prune` if `prunable`
   entries were approved, remove approved worktrees with
   `git worktree remove <path>`, run `git fetch origin --prune`, and delete
   approved local branches (using `-D` only for confirmed `MERGED` PRs or
   explicitly approved branches).
5. **Rebase the default branch.** Proceed to [Finish](#finish).

## Finish

If the main checkout has uncommitted changes or is not on the target base
branch, ask before switching; otherwise run `git rebase origin/<base>` and
verify with `git status --short --branch` and `git log -n 3 --oneline`.
Report the removed worktrees, deleted branches, and updated base commit.
