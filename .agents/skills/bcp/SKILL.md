---
name: bcp
description: Branch, commit, and open a PR in one step.
disable-model-invocation: true
metadata:
  model-tier: trivial
---

Ship the current changes with [branch](../branch/SKILL.md),
[commit](../commit/SKILL.md), then [open-pr](../open-pr/SKILL.md). Stop if a
step has nothing to do (for example, no changes to commit).

1. **Branch.** On the default branch, use branch. Otherwise ask whether to
   ship from the current branch (it may be left over) or create a new branch
   with branch. Proceed when settled.
2. **Commit.** Use commit; proceed when the changes are committed.
3. **Open the PR.** If `gh stack view` finds an active stack, use
   [stacked-prs](../stacked-prs/SKILL.md); otherwise use open-pr. Finish when
   the PR or stack is up.

When asking which branch to use, show:

```txt
You're on `<current-branch>`. Ship from:
1. `<current-branch>`, committing there.
2. A new branch, created by the branch skill.
```
