---
name: pr-merge
description: >-
  Merge a GitHub pull request and clean up its local worktree or branch. Use
  when the user asks to merge a PR, land a pull request, or merge and clean
  up.
argument-hint: "[--pr=<url|#number>] [--auto] [--strategy=<squash|merge|rebase>] [steering]"
allowed-tools: Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh repo view:*), Bash(git status:*), Bash(git worktree list:*), Bash(git symbolic-ref --quiet --short HEAD), Bash(git symbolic-ref refs/remotes/origin/HEAD)
metadata:
  model-tier: trivial
---

Merge an open GitHub pull request and clean up its local worktree or branch.

- **Interactive (default):** Confirm before running `gh pr merge`.
- **`--auto`:** Merge and run local cleanup without prompting once all checks
  pass, honouring runtime permissions and stopping on any blocker below.

1. **Resolve the PR.** Accept `--pr=<url|#number>`; if omitted, infer
   the PR for the current branch with `gh pr view`. Run
   `gh pr view <pr> --json number,url,title,state,isDraft,mergeable,mergeStateStatus,reviewDecision,headRefName,baseRefName`.
   Stop and report if `state` is not `OPEN`, `isDraft` is `true`, or merge
   conflicts, failing checks, or missing required reviews block merging.

2. **Confirm and merge.** Check permitted strategies with
   `gh repo view --json squashMergeAllowed,mergeCommitAllowed,rebaseMergeAllowed,deleteBranchOnMerge`.
   Default to `--squash` unless `--strategy=<squash|merge|rebase>` (or
   steering) overrides it. If an explicit strategy is disallowed by the repo,
   stop and report; if default squash is disallowed, use the sole permitted
   strategy or ask if multiple remain. Without `--auto`, present the PR title,
   URL, `<base> <- <head>`, merge strategy, and check/review summary, and wait
   for confirmation. Run `gh pr merge <pr> --<strategy> --delete-branch`
   (omitting `--delete-branch` when `deleteBranchOnMerge` is `true`) and
   verify `state` is `MERGED`.

3. **Clean up conditionally.** Check `git worktree list --porcelain` for
   `headRefName`:
   - If a worktree holds `headRefName`, read and follow
     [worktree-cleanup](../worktree-cleanup/SKILL.md) with `--pr=<pr-url>`.
   - Otherwise, read and follow [branch](../branch/SKILL.md) with
     `--cleanup=<headRefName>`.

**Done when** the PR is `MERGED` and local cleanup is complete.
