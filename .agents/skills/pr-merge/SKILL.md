---
name: pr-merge
description: >-
  Merge a GitHub pull request and clean up its local worktree or branch. Use
  when the user asks to merge a PR, land a pull request, or merge and clean
  up.
argument-hint: "[pr-url | #<pr-number>]"
allowed-tools: Bash(gh pr view:*), Bash(gh pr list:*), Bash(gh repo view:*), Bash(git status:*), Bash(git worktree list:*), Bash(git symbolic-ref:*)
metadata:
  model-tier: trivial
---

Merge an open GitHub pull request and clean up its local worktree or branch.

1. **Resolve the PR.** Accept a PR URL or `#<pr-number>`; if omitted, infer
   the PR for the current branch with `gh pr view`. Run
   `gh pr view <pr> --json number,url,title,state,isDraft,mergeable,mergeStateStatus,reviewDecision,headRefName,baseRefName`.
   Stop and report if `state` is not `OPEN`, `isDraft` is `true`, or merge
   conflicts, failing checks, or missing required reviews block merging.

2. **Confirm and merge.** Present the PR title, URL, `<base> <- <head>`, and
   check/review summary, then ask for confirmation (and merge strategy if the
   repo permits more than one) before running `gh pr merge`. Run
   `gh pr merge <pr> --<strategy> --delete-branch` (or omit `--delete-branch`
   if the repo deletes head branches automatically) and verify `state` is
   `MERGED`.

3. **Clean up conditionally.** Check `git worktree list --porcelain` for
   `headRefName`:
   - If a worktree holds `headRefName`, read and follow
     [worktree-cleanup](../worktree-cleanup/SKILL.md) with `<pr-url>`.
   - Otherwise, read and follow [branch](../branch/SKILL.md) with
     `--cleanup <headRefName>`.

**Done when** the PR is `MERGED` and local cleanup is complete.
