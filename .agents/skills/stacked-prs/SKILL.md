---
name: stacked-prs
description: >-
  Create, adopt, extend, submit, sync, restructure, inspect, or merge
  dependent pull requests with the official gh-stack extension. Use when
  the user requests stacked PRs, a plan or task list declares PR layers,
  or work crosses a stack-layer boundary.
allowed-tools: Bash(git branch:*), Bash(git status:*), Bash(gh extension:*), Bash(gh stack:*)
---

# Stacked Pull Requests

Manage dependent pull requests with `gh stack`.

A stack layer is a confirmed review unit, not a task. One layer may contain
several tasks or vertical slices.

## Process

1. **Verify the extension.**

   ```bash
   gh stack --help
   ```

   If unavailable, ask before installing it:

   ```bash
   gh extension install github/gh-stack
   ```

1. **Resolve the delivery mapping.**

   Use `Pull Request Delivery` from the active project plan or task document
   when present. If neither declares delivery, determine and confirm the shape
   using
   [`PULL-REQUEST-DELIVERY.md`](../shared/PULL-REQUEST-DELIVERY.md).

   If the confirmed mode is not `Stack`, stop and use the ordinary branch and
   PR workflow for each review unit.

1. **Create or adopt the stack.**

   For new work, initialize the bottom layer. Add higher layers only when work
   moves across their confirmed boundary:

   ```bash
   gh stack init --base <trunk> <bottom-branch>
   gh stack add <next-branch>
   ```

   Adopt existing branches in bottom-to-top order:

   ```bash
   gh stack init --base <trunk> <bottom> <middle> <top>
   ```

   Check out an existing stack or layer with:

   ```bash
   gh stack checkout <stack-number-or-branch>
   ```

   Use `gh stack link` when PRs already exist on GitHub and local stack
   tracking is unnecessary.

1. **Work and submit.**

   Complete every task assigned to the current layer on its branch. Use the
   [`commit`](../commit/SKILL.md) skill for commits. Run `gh stack add` only
   when entering the next layer.

   Inspect and submit the complete stack:

   ```bash
   gh stack view --short
   gh stack submit
   ```

   Prefer the interactive submit editor so the user can review every PR's
   title, body, and draft state. Use `--auto` only when the user accepts
   generated titles; it creates new PRs as drafts unless `--open` is set.

   Keep the stack current with `gh stack sync`. Use `gh stack rebase` to
   resolve rebase conflicts and `gh stack modify` to fold, reorder, insert, or
   rename layers.

1. **Merge.**

   ```bash
   gh stack merge
   gh stack sync --prune
   ```

   `gh stack merge` atomically merges the selected layer and every layer below
   it. Stop if any selected layer is a draft, has failing checks, or is not
   ready.

## Completion

Finish when the stack matches the confirmed delivery mapping, every submitted
PR has the correct base, and `gh stack view --short` reports no layer needing a
rebase.

## Reference

- [GitHub stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/stacked-pull-requests)
