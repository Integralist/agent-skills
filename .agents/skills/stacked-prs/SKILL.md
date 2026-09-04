---
name: stacked-prs
description: >-
  Create, adopt, extend, submit, sync, restructure, inspect, or merge
  dependent pull requests with the official gh-stack extension. Use when
  the user requests stacked PRs, a plan or task list declares PR layers,
  or work crosses a stack-layer boundary.
allowed-tools: Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git merge-base:*), Bash(gh extension:*), Bash(gh stack:*), Bash(gh pr:*)
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

   Commit all pending work on the current branch using the
   [`commit`](../commit/SKILL.md) skill before running `gh stack add` or
   switching layers.

   Use `gh stack link` when PRs already exist on GitHub and local stack
   tracking is unnecessary.

1. **Work and commit.**

   Complete every task assigned to the current layer on its branch.
   Use the [`commit`](../commit/SKILL.md) skill for all commits.

   - Commit all pending changes via `commit` before switching layers (`gh stack
     checkout`), adding a new layer (`gh stack add`), syncing, rebasing, or
     submitting. Never carry uncommitted changes across layer boundaries.

1. **Draft PRs and submit.**

   Inspect the stack:

   ```bash
   gh stack view --short
   ```

   For each PR layer in the stack, draft its title and description using the
   [`draft-pr`](../draft-pr/SKILL.md) skill against that layer's base branch
   (trunk for the bottom layer; the parent layer's branch for higher layers).
   Follow `draft-pr` to obtain explicit user approval for each layer's PR.

   Submit the stack to push branches and create or update the PR chain on
   GitHub:

   ```bash
   gh stack submit --auto
   ```

   Pass `--open` to open PRs ready for review instead of drafts.

   Apply the approved titles and descriptions to each PR:

   ```bash
   gh pr edit <branch> --title "<title>" --body-file /tmp/pr-body-<layer>.txt
   ```

   Write each PR description to a temp file and pass with `--body-file` (never
   pipe via heredocs). In an interactive terminal where the user runs `gh stack
   submit`, they may paste the approved content directly into the submit
   editor.

   Keep the stack current with `gh stack sync`. Use `gh stack rebase` to
   resolve rebase conflicts and `gh stack modify` to fold, reorder, insert, or
   rename layers. Commit any pending changes via `commit` before rebasing.

1. **Validate CI and merge.**

   Merging is strictly bottom-to-top into trunk. For every PR layer to be
   merged, check CI status and linters:

   ```bash
   gh pr checks <PR>
   ```

   Stop if any checks or linters fail. Check out the failing layer's branch,
   fix the issues, commit with [`commit`](../commit/SKILL.md), and re-sync or
   re-submit before continuing.

   Once all checks pass and reviews are approved, merge atomically:

   ```bash
   gh stack merge --yes --squash
   gh stack sync --prune
   ```

   - To merge a subset of the stack, pass the PR number (`gh stack merge
     <pr-number> --yes --squash`); it merges from the bottom layer up to that
     PR.
   - Use `--squash`, `--rebase`, or `--merge` matching the repo convention.
   - If atomic merge fails or is blocked by branch protection, fall back to
     merging manually bottom-up from layer 1 into trunk (GitHub will retarget
     each subsequent PR to trunk as its base merges), then run `gh stack sync
     --prune`.
   - Stop if any selected layer is a draft, has failing checks, or is not
     ready.

## Completion

Finish when the stack matches the confirmed delivery mapping, every submitted
PR has the correct base with a user-approved title and description matching the
[`draft-pr`](../draft-pr/SKILL.md) skill, `gh pr checks <PR>` passes for all
layers, and `gh stack view --short` reports no layer needing a rebase.

## Reference

- [GitHub stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/stacked-pull-requests)
