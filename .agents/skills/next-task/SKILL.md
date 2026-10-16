---
name: next-task
description: Work on the next task in a plan or task list.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Next Task

Do the next ready item from a plan or task list, then tick it off. Do one item
per run, and do the work yourself in the main thread, without subagents.

1. **Pick the file.** Use the file the user names. If they name none, use the
   one from earlier in this session. If there isn't one, ask for its path.

2. **Pick the item.** Take the first unticked item, in document order, whose
   blocked-by items are done. Name the item you picked. If nothing is ready,
   report what blocks it and stop.

3. **Build it** following [BUILD-ITEM.md](../shared/BUILD-ITEM.md). Done when
   it's verified and ticked off.

4. **Report and offer to commit.** Say what was done and what's left, then ask
   whether to commit. If yes, use the commit skill.
