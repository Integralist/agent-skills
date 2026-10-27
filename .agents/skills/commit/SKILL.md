---
name: commit
description: >-
  Create git commits with intelligent file grouping. Use when
  committing changes or drafting a commit message.
argument-hint: '[force]'
allowed-tools: Bash(git status:*), Bash(git add:*), Bash(git diff:*), Bash(git commit:*)
metadata:
  model-tier: trivial
---

Commit the working tree as one or more Conventional Commits, following
[GIT-COMMIT.md](../shared/GIT-COMMIT.md) for safety, staging by name, message
shape, and `git commit -F <file>`. Start with `git status --short --branch` and
`git diff HEAD`.

**Branch.** On `main` or `master`, unless the user passed `force`, warn them
and ask for approval to commit there. If they decline, use the branch skill to
create a branch, then carry on.

**Staging.** If the tree is clean, say so and stop. If the user has already
staged files, ask whether to commit only those or everything — their stage is
deliberate.

**Grouping.** Group files by purpose — a change with its tests, docs, config —
and commit groups in dependency order. Commit an obvious grouping straight
away. When it's ambiguous, offer 2–3 numbered groupings with your
recommendation and wait.
