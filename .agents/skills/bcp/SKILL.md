---
name: bcp
description: Branch, commit, and open a PR in one step.
disable-model-invocation: true
metadata:
  model-tier: moderate
---

# Branch → Commit → PR

Ship the current changes by running the branch, commit, and open-pr skills in
that order. Start each step only after the one before it finishes. If a step
finds nothing to do, such as no changes to commit, stop there.

1. **Branch.** On the default branch, use the branch skill. On any other
   branch, ask first, in case it's left over from earlier work:

   ```txt
   You're on `<current-branch>`. Ship from:
   1. `<current-branch>`, committing there.
   2. A new branch, created by the branch skill.
   ```

   Done when you're on the branch the work ships from.

2. **Commit.** Use the commit skill. Done when the changes are committed.

3. **PR.** Use the open-pr skill. Done when the PR is open, or open-pr has
   handed a stack to stacked-prs.
