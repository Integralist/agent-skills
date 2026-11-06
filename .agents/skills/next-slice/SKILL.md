---
name: next-slice
description: Work through every task in one slice of a plan or task list.
disable-model-invocation: true
metadata:
  model-tier: moderate
---

Complete every ready item in one slice of a plan or task list, then offer one
commit for the slice. Keep implementation and troubleshooting in the main
thread. Delegate test runs as
[BUILD-ITEM.md](../shared/BUILD-ITEM.md) describes; read-only review may also
be delegated through code-review. Stop after this slice.

1. **Select the file and slice.** Use the file named by the user, or the one
   already in use this session. If neither exists, ask for the path. For
   `github` or an issue reference (`#<n>` or URL), read and follow
   [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and
   Issue Artifacts instead of `projects/`. Use the
   requested slice number, or choose the first slice with unticked items or
   missing acceptance or a missing current required review. A file without
   slices is one slice. Before edits, record or resume the review baseline
   for the slice using [REVIEW-CHANGE.md](../shared/REVIEW-CHANGE.md), including
   when resuming older work. If the slice's items are complete, go to step 3.
   If all slices are accepted with current required reviews, report that no
   slice is left and stop. Identify the slice, baseline, and review owner.
2. **Work the slice.** Follow [BUILD-ITEM.md](../shared/BUILD-ITEM.md) for
   each item in document order. Skip items whose blocked-by items are not
   done. If nothing is ready, report the blockers and stop. Finish with every
   item ticked off or blocked.
3. **Accept the slice.** Follow [ACCEPT-SLICE.md](../shared/ACCEPT-SLICE.md),
   including code-review when run standalone. An active execute-plan
   coordinator may explicitly own review scheduling; pass review ownership
   to it rather than repeating its reviews. Keep the slice unaccepted while
   required outcomes or due reviews lack evidence. Record acceptance or the
   verification gaps still open.
4. **Report and offer to commit.** State what was done, review status, and
   what is left. Ask whether to commit once for the whole slice, not per
   task. If the user agrees, use the commit skill.
