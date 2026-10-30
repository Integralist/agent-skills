---
name: next-slice
description: Work through every task in one slice of a plan or task list.
disable-model-invocation: true
metadata:
  model-tier: moderate
---

# Next Slice

Do every ready item in one slice of a plan or task list, then offer one commit.
Keep implementation and failure diagnosis in the main thread. Only test
execution may be delegated, as [BUILD-ITEM.md](../shared/BUILD-ITEM.md)
describes. Stop at the end of the slice.

1. **Pick the file and slice.** Use the file the user names. If they name none,
   use the one from earlier in this session. If there isn't one, ask for its
   path. Use the slice number the user gives; if none, take the first slice
   with unticked items or missing acceptance. A file without slices counts as
   one slice. If its items are already complete, continue at step 3. If all
   slices are accepted, report that no slice remains and stop.

2. **Work each item** in document order, following
   [BUILD-ITEM.md](../shared/BUILD-ITEM.md). Skip items whose blocked-by items
   aren't done; if nothing in the slice is ready, report what blocks it and
   stop. Done when every item is ticked off or blocked.

3. **Accept the slice** following
   [ACCEPT-SLICE.md](../shared/ACCEPT-SLICE.md). Keep it unaccepted while any
   required outcome lacks passing evidence. Done when acceptance or the
   remaining verification gaps are recorded.

4. **Report and offer to commit.** Say what was done and what's left.
   Commit once for the whole slice at the end, not per task: ask whether to
   commit, and if yes, use the commit skill.
