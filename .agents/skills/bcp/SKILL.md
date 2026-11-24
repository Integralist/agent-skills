---
name: bcp
description: Branch, commit, and open a PR in one step.
disable-model-invocation: true
metadata:
  model-tier: trivial
---

Ship the current changes by reading and following
[branch](../branch/SKILL.md), [commit](../commit/SKILL.md), then
[open-pr](../open-pr/SKILL.md). Stop if a step has nothing to do (for example,
no changes to commit).

1. **Branch.** On the default branch, read and follow
   [branch](../branch/SKILL.md). Otherwise ask whether to ship from the
   current branch (it may be left over) or create a new one with it. Proceed
   when settled.
2. **Commit.** Read and follow [commit](../commit/SKILL.md); proceed when the
   changes are committed.
3. **Open the PR.** If `gh stack view` finds an active stack, read and follow
   [stacked-prs](../stacked-prs/SKILL.md); otherwise read and follow
   [open-pr](../open-pr/SKILL.md). Finish when the PR or stack is up.

When asking which branch to use, show:

```txt
You're on `<current-branch>`. Ship from:
1. `<current-branch>`, committing there.
2. A new branch, created by the branch skill.
```
