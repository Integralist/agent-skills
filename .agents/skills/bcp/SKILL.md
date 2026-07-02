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

   - If on the base branch, invoke the `branch` skill to create a
     feature branch before committing. Follow its process,
     including its prompt to confirm the slug if the intent is
     unclear.

1. **Commit.** Invoke the `commit` skill to stage and commit the
   changes with intelligent grouping. Follow its process exactly,
   including its prompts for ambiguous grouping.

1. **PR.** Invoke the `draft-pr` skill to push the branch and open
   the pull request. Follow its process, including showing the
   title and description for approval before opening.

## Notes

- If there are no changes to commit, stop and say so.
