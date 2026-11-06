---
name: stacked-prs
description: >-
  Create, submit, sync, and merge stacked pull requests with the gh stack
  extension. Use when the user or a coordinating skill asks for stacked PRs.
allowed-tools: Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git merge-base:*), Bash(gh extension:*), Bash(gh stack:*), Bash(gh pr:*)
metadata:
  model-tier: moderate
---

Manage dependent PRs with `gh stack`. The caller supplies branches in order;
ask if the user names none. Run only requested steps (for example, step 2
alone to prepare a layer). Before switching, adding, syncing, rebasing, or
submitting layers, commit pending work with the commit skill so it cannot land
in the wrong layer.

## Set up the stack

1. **Check the extension.** Run `gh stack --help`. If missing, ask before
   `gh extension install github/gh-stack`.
2. **Set up the requested stack:**
   - New stack: `gh stack init --base <trunk> <bottom-branch>`, then run
     `gh stack add <branch>` for each higher layer as work reaches it.
   - Existing branches: `gh stack init --base <trunk> <bottom> … <top>`.
   - Existing stack: `gh stack checkout <stack-number-or-branch>`.

   Setup is complete when `gh stack view --short` lists layers bottom to top.

## Prepare and submit PRs

3. **Write each layer's PR description** using
   [PR-DESCRIPTION.md](../shared/PR-DESCRIPTION.md). Target the layer's base:
   trunk for the bottom layer and the layer below for each higher layer. For
   `github` or an issue reference (`#<n>` or URL), read and follow
   [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and
   Issue Artifacts instead of `projects/`. Show every title and body, then wait
   for the user's approval.
4. **Submit** with `gh stack submit --auto --open` to push and open PRs ready
   for review; `--auto` alone opens drafts. Then write each approved body to
   a temporary file and run
   `gh pr edit <branch> --title "<title>" --body-file <file>`.
   Complete when GitHub shows each approved title and body.

## Maintain and merge

5. **Keep the stack current.** Run `gh stack sync` after trunk or a lower
   layer changes. Use `gh stack rebase` to resolve conflicts and
   `gh stack modify` to fold, reorder, insert, or rename layers.
6. **Merge bottom to top only.** Merge only when every layer being merged has
   passing `gh pr checks <PR>` and approved reviews. If a check fails, fix it
   on that layer and resubmit. Run
   `gh stack merge --yes --<squash|rebase|merge>` using the repository's merge
   style; pass a PR number to merge only through that layer. Then run
   `gh stack sync --prune`.

   If branch protection blocks the merge, merge each PR manually from the
   bottom up, then run `gh stack sync --prune`. Merging is complete when the
   merged layers are in trunk.
