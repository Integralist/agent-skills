---
name: bcp
description: >-
  Branch, commit, and open a PR in one step. Creates a feature
  branch off the current base, commits the changes, then drafts
  and opens a pull request.
disable-model-invocation: true
---

# Branch → Commit → PR

Orchestrate the full "ship my changes" flow. Run the three steps
in order, stopping if any step needs the user's input.

## Process

1. **Branch.** Check the current branch:

   ```bash
   git branch --show-current
   ```

   - If already on a feature branch (not `main`/`master` or the
     repo's default branch), keep it — skip to step 2.

   - If on the base branch, create a feature branch before
     committing. Derive a short, kebab-case name from the nature
     of the changes (e.g. `fix-login-redirect`). Follow any
     branch-naming convention you can infer from recent branches
     (`git branch -a`) or `~/.gitcommit`. If the intent is
     unclear, ask the user for a name.

     ```bash
     git switch -c <branch-name>
     ```

1. **Commit.** Invoke the `commit` skill to stage and commit the
   changes with intelligent grouping. Follow its process exactly,
   including its prompts for ambiguous grouping.

1. **PR.** Invoke the `draft-pr` skill to push the branch and open
   the pull request. Follow its process, including showing the
   title and description for approval before opening.

## Notes

- If there are no changes to commit, stop and say so.
