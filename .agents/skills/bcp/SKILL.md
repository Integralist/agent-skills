---
name: bcp
description: >-
  Branch, commit, and open a PR in one step. Creates a feature
  branch off the current base, commits the changes, then drafts
  and opens a pull request.
disable-model-invocation: true
---

# Branch → Commit → PR

Orchestrate the "ship my changes" flow. Run the three steps in
order, stopping if any needs the user's input.

## Process

1. **Branch.** Check the current branch:

   ```bash
   git branch --show-current
   ```

   - If already on a feature branch (not `main`/`master` or the
     repo's default branch), keep it — skip to step 2.

   - If on the base branch, create a feature branch before
     committing. Name it `<git_username>/<feature-slug>`, where
     `<git_username>` comes from git config and `<feature-slug>`
     is a short, kebab-case description of the changes (e.g.
     `fix-login-redirect`). If the intent is unclear, ask the
     user for the slug.

     Slugify the username so spaces and other non-alphanumeric
     characters become hyphens (e.g. "First Last" → `first-last`):

     ```bash
     git_username=$(git config user.name \
       | tr '[:upper:]' '[:lower:]' \
       | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
     git switch -c "${git_username}/<feature-slug>"
     ```

1. **Commit.** Invoke the `commit` skill to stage and commit the
   changes with intelligent grouping. Follow its process exactly,
   including its prompts for ambiguous grouping.

1. **PR.** Invoke the `draft-pr` skill to push the branch and open
   the pull request. Follow its process, including showing the
   title and description for approval before opening.

## Notes

- If there are no changes to commit, stop and say so.
