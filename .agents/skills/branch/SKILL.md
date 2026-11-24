---
name: branch
description: >-
  Create a git feature branch named for the current session's work. Use when
  the user asks to start, create, or cut a branch.
argument-hint: "[--cleanup[=<branch>]] [steering]"
allowed-tools: Bash(gh pr list:*), Bash(git branch:*), Bash(git config:*), Bash(git fetch:*), Bash(git rebase:*), Bash(git status:*), Bash(git switch:*), Bash(git symbolic-ref:*)
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
   the working tree has uncommitted changes. Confirm the branch is merged via
   `gh pr list --head <branch> --state merged --json number,url` or
   `git branch --merged <default-branch>`. Stop if unmerged unless the user
   explicitly approves.
2. **Sync base and delete.** Switch to `<default-branch>` if currently on
   `<branch>`, run `git fetch origin --prune`, and rebase `<default-branch>`
   onto `origin/<default-branch>` if clean. Delete `<branch>` (`git branch -d`,
   or `-D` only after confirming `MERGED` PR status). Done when `<branch>` is
   removed and `<default-branch>` is up to date.
