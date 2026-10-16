---
name: stacked-prs
description: >-
  Create, submit, sync, and merge stacked pull requests with the gh stack
  extension. Use when the user or a coordinating skill asks for stacked PRs.
allowed-tools: Bash(git branch:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git merge-base:*), Bash(gh extension:*), Bash(gh stack:*), Bash(gh pr:*)
metadata:
  model-tier: moderate
---

# Stacked PRs

Manage a stack of dependent pull requests with `gh stack`. The layers (which
branches, in what order) come from whoever called this skill; if the user
called it with none named, ask. Run only the steps the caller needs, such as
step 2 alone to get a layer's branch ready. Before any command that switches,
adds, syncs, rebases, or submits layers, commit pending work with the commit
skill, so changes never land in the wrong layer.

1. **Check the extension.** Run `gh stack --help`. If it's missing, ask before
   running `gh extension install github/gh-stack`.

2. **Set up the stack.**

   - New stack: `gh stack init --base <trunk> <bottom-branch>`, then
     `gh stack add <branch>` for each higher layer once work reaches it.
   - Existing branches: `gh stack init --base <trunk> <bottom> … <top>`.
   - Existing stack: `gh stack checkout <stack-number-or-branch>`.

   Done when `gh stack view --short` lists the layers bottom to top.

3. **Write each layer's PR** following
   [PR-DESCRIPTION.md](../shared/PR-DESCRIPTION.md), against the layer's base:
   the trunk for the bottom layer, the layer below for the rest. Show each
   title and body and wait for the user's approval. Done when every layer has
   an approved title and body.

4. **Submit.** Run `gh stack submit --auto --open` to push and open the PRs
   ready for review; `--auto` alone opens drafts. Then write each body to a
   temp file and run
   `gh pr edit <branch> --title "<title>" --body-file <file>`. Done when every
   PR on GitHub shows its approved title and body.

5. **Keep it current.** Run `gh stack sync` after the trunk or a lower layer
   changes, `gh stack rebase` to resolve conflicts, and `gh stack modify` to
   fold, reorder, insert, or rename layers.

6. **Merge**, bottom to top only, once every layer being merged has passing
   `gh pr checks <PR>` and approved reviews. If a check fails, fix it on that
   layer and resubmit. Run `gh stack merge --yes --<squash|rebase|merge>` with
   the repo's merge style; pass a PR number to merge only up to that layer.
   Then run `gh stack sync --prune`. If branch protection blocks the merge,
   merge each PR by hand from the bottom up, then run `gh stack sync --prune`.
   Done when the merged layers are in the trunk.
