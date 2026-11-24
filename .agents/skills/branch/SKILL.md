---
name: branch
description: >-
  Create a git feature branch named for the current session's work. Use when
  the user asks to start, create, or cut a branch.
argument-hint: "[--cleanup[=<branch>]] [steering]"
allowed-tools: Bash(gh pr list:*), Bash(git branch:*), Bash(git config:*), Bash(git fetch:*), Bash(git rebase:*), Bash(git rev-parse:*), Bash(git status:*), Bash(git switch:*), Bash(git symbolic-ref:*), Bash(git worktree:*)
metadata:
  model-tier: trivial
---

Create a feature branch `<git-username>/<slug>` from the chosen base, or clean
up a merged branch with `--cleanup`.

**Base.** If already on the repository's default branch, branch from it.
Otherwise ask:

```txt
You're on `<current-branch>`. Create `<name>` by:
1. Switching back to `<default-branch>` and branching from it.
2. Branching from `<current-branch>`.
```

**Name.** Lowercase the git username and turn each run of characters other
than letters and digits into one hyphen (`First Last` → `first-last`). Draw the
slug from the session's work: a few kebab-case words with no
Conventional Commit type prefix (`fix-login-redirect`). If there's no clear
task, propose a slug and wait for the user to confirm it.

**Create.** Run `git switch -c <name> <base>`. Done when the new branch is
checked out and you've reported its name.

## Cleanup (`--cleanup[=<branch>]`)

1. **Identify and verify.** Target `<branch>` from `--cleanup=<branch>` if
   given, or the current branch when omitted and not on `<default-branch>`.
   Stop if `<branch>` is `<default-branch>` or
   any owning worktree has uncommitted or untracked changes. Confirm the
   branch is merged via `git branch --merged <default-branch>` or
   `gh pr list --head <branch> --state merged --json number,url,headRefOid,baseRefName`.
   When relying on a merged PR, verify that it targeted `<default-branch>` and
   its `headRefOid` matches `git rev-parse <branch>`; if local commits exist
   beyond the PR head, show them and stop unless the user explicitly approves
   discarding them. Stop if unmerged unless the user explicitly approves.
2. **Resolve worktrees, sync base, and delete.** Check
   `git worktree list --porcelain`. If `<branch>` is checked out in a linked
   worktree, confirm that worktree is clean and remove it with
   `git worktree remove <path>` (ask first if running from inside that
   worktree or if the branch was unmerged). Run `git fetch origin --prune`,
   then rebase `<default-branch>` onto `origin/<default-branch>` in the
   worktree that already holds `<default-branch>` if clean (switching to
   `<default-branch>` only when no other worktree holds it). Delete `<branch>`
   (`git branch -d`, or `-D` only after confirming a matching `MERGED` PR tip
   and base or explicit user approval). Done when `<branch>` is removed and
   `<default-branch>` is up to date.
