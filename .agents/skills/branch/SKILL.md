---
name: branch
description: >-
  Create a git feature branch named for the current session's work. Use when
  the user asks to start, create, or cut a branch.
allowed-tools: Bash(git branch:*), Bash(git config:*), Bash(git status:*), Bash(git switch:*), Bash(git symbolic-ref:*)
metadata:
  model-tier: trivial
---

Create a feature branch `<git-username>/<slug>` from the chosen base.

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
