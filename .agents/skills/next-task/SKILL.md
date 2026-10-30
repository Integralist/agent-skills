---
name: next-task
description: Work on the next task in a plan or task list.
disable-model-invocation: true
metadata:
  model-tier: moderate
---

# Next Task

Do the next ready item from a plan or task list, then tick it off. Do one item
per run. Keep implementation and failure diagnosis in the main thread. Only
test execution may be delegated, as [BUILD-ITEM.md](../shared/BUILD-ITEM.md)
describes.

1. **Pick the file.** Use the file the user names. If they name none, use the
   one from earlier in this session. If there isn't one, ask for its path.

2. **Pick the item.** Before selecting another item in a multi-slice file,
   route any completed slice with missing acceptance to step 4. Otherwise take
   the first unticked item, in document order, whose blocked-by items are
   done. Name the item and owning slice you picked. When no items remain but
   slice acceptance is missing, continue at step 4. If nothing is ready
   because items are blocked, report the blockers and stop. If no work or
   acceptance remains, report that no item remains and stop.

3. **Build it** following [BUILD-ITEM.md](../shared/BUILD-ITEM.md). Done when
   it's verified and ticked off.

4. **Accept a finished slice.** Follow
   [ACCEPT-SLICE.md](../shared/ACCEPT-SLICE.md) when all items in the owning
   slice are complete, including on resume without a new implementation item.
   A file without slices counts as one slice. Otherwise leave slice
   acceptance pending; a verified task can still be complete. Done when
   acceptance or the remaining verification gaps are recorded.

5. **Report and offer to commit.** Distinguish item completion from slice
   acceptance. Say what was done and what's left, then ask whether to commit.
   If yes, use the commit skill.
