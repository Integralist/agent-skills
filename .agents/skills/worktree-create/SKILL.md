---
name: worktree-create
description: >-
  Create a sibling Git worktree on a feature branch for isolated project work.
  Use when starting feature planning or implementation off the main checkout,
  or when the user asks to create or open a worktree.
argument-hint: "[<repo-path>] [<slug>]"
allowed-tools: Bash(git branch:*), Bash(git config:*), Bash(git rev-parse:*), Bash(git status:*), Bash(git symbolic-ref:*), Bash(git worktree:*)
metadata:
  model-tier: trivial
---

Create a sibling Git worktree `../<repo>-<slug>/` on `<git-username>/<slug>` so
the main checkout stays clean on its default branch.

1. **Resolve repo, base, and current checkout.** Use `<repo-path>` if given
   (otherwise `cwd`), passing `-C <repo-path>` to all `git` commands; if not
   inside a Git repository, ask for the repository path. Find the main
   checkout path and repo directory name `<repo>` (`git worktree list
   --porcelain` first entry), plus `<default-branch>` (`git symbolic-ref
   refs/remotes/origin/HEAD` or `main`/`master`). If already inside a linked
   worktree rather than the main checkout, report its path and branch and ask
   whether to work here or create a sibling worktree next to the main checkout.
   Otherwise base the new worktree on `<default-branch>` (or ask if currently
   on a non-default branch with unmerged work).

2. **Name the branch and worktree.** Lowercase `git config user.name` and
   collapse non-alphanumeric runs to single hyphens (`First Last` →
   `first-last`). Derive a short kebab-case `<slug>` without a Conventional
   Commit prefix from the argument or session task (ask if unclear). Set:
   - Branch: `<git-username>/<slug>`
   - Path: `<parent-of-main-checkout>/<repo>-<slug>`

   If `../<repo>-<slug>` or `<git-username>/<slug>` already exists, check
   `git worktree list` and offer to reuse the existing worktree or pick a new
   slug.

3. **Create and hand off.** Run
   `git -C <main-checkout> worktree add -b <git-username>/<slug> <worktree-path> <base>`.
   Report the absolute `<worktree-path>` and branch name, and run all
   subsequent file edits and commands inside `<worktree-path>` (or ask if the
   user wants to reopen the session there).
