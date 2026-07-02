---
name: branch
description: >-
  Create a git feature branch named for the current session's
  work. Slugifies the git username and derives a short kebab-case
  feature slug from the changes or task under discussion. Use when
  the user asks to start, create, or cut a branch.
allowed-tools: Bash(git branch:*), Bash(git config:*), Bash(git status:*), Bash(git switch:*), Bash(git symbolic-ref:*)
---

# Branch

Create a feature branch named `<git-username>/<feature-slug>`, off
the current base branch, using the session context to name it.

## Context

If the fields below show commands rather than output, run each one first.

- Branch: !`git branch --show-current 2>/dev/null || echo "(not a git repo)"`
- Default branch: !`git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo "(unknown)"`
- Git username: !`git config user.name 2>/dev/null || echo "(unset)"`
- Status: !`git status --short 2>/dev/null`

## Process

1. **Check the current branch.**

   - Not a git repo → stop and say so.
   - Already on a feature branch (not `main`/`master` or the repo's
     default branch) → stop and report it. Don't nest a branch off
     another feature branch unless the user explicitly asks.
   - On the base branch → continue.

1. **Derive the username segment.** Slugify `git config user.name`
   so spaces and other non-alphanumeric characters become hyphens
   (e.g. "First Last" → `first-last`):

   ```bash
   git_username=$(git config user.name \
     | tr '[:upper:]' '[:lower:]' \
     | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
   ```

   If `user.name` is unset, ask the user for the segment.

1. **Derive the feature slug from session context.** A short,
   kebab-case description of the work (e.g. `fix-login-redirect`).
   Draw it, in order of preference, from:

   - Uncommitted changes in the working tree (see Status above).
   - The task the user is actively working on in this session.
   - What the user states directly.

   Keep it concise — a few words, lowercase, hyphen-separated, no
   type prefix. If the intent is unclear or you'd be guessing,
   propose a slug and confirm before creating the branch.

1. **Create the branch:**

   ```bash
   git switch -c "${git_username}/<feature-slug>"
   ```

1. **Report** the new branch name.
