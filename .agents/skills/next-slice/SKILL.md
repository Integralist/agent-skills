---
name: next-slice
description: Work through every task in one slice of a plan or task list.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Next Slice

Do every ready item in one slice of a plan or task list, then offer one commit.
Do the work yourself in the main thread, without subagents, and stop at the
end of the slice.

1. **Pick the file and slice.** Use the file the user names. If they name none,
   use the one from earlier in this session. If there isn't one, ask for its
   path. Use the slice number the user gives; if none, take the first slice
   with unticked items. A file without slices counts as one slice.

2. **Work each item** in document order, following
   [BUILD-ITEM.md](../shared/BUILD-ITEM.md). Skip items whose blocked-by items
   aren't done; if nothing in the slice is ready, report what blocks it and
   stop. Done when every item is ticked off or blocked.

3. **Accept the slice.** Run the project's full test suite. Mark the slice
   accepted only when every milestone outcome in it is verified, not because
   its tasks are ticked.

4. **Report and offer to commit.** Say what was done and what's left.
   Commit once for the whole slice at the end, not per task: ask whether to
   commit, and if yes, use the commit skill.
