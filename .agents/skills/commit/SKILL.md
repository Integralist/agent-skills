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

Commit the working tree as one or more Conventional Commits. Follow
[GIT-COMMIT.md](../shared/GIT-COMMIT.md) for safety, staging by name, message
shape, and `git commit -F <file>`. Start with `git status --short --branch`
and `git diff HEAD`.

**Branch protection.** On `main` or `master`, warn and ask for approval before
committing unless the user passed `force`. If they decline, use
[branch](../branch/SKILL.md) to create a branch, then continue.

**Staging.** If the tree is clean, say so and stop. If files are already
staged, ask whether to commit only those or everything; treat the existing
stage as deliberate.

**Grouping.** Group related files (including tests, docs, and config) in
dependency order. Commit obvious groups; if unclear, offer 2–3 numbered
options, recommend one, and wait for the user's choice.
