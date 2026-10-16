---
name: next-task
description: Work on the next task in a plan or task list.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Next Task

Do the next ready item from a plan or task list, test-first, then tick it off.
Do one item per run, and do the work yourself in the main thread, without
subagents.

1. **Pick the file.** Use the file the user names. If they name none, use the
   one from earlier in this session. If there isn't one, ask for its path.

2. **Pick the item.** Take the first unticked item, in document order, whose
   blocked-by items are done. A task list holds exact tasks; a plan holds
   milestone outcomes, which you break into test-first steps yourself. Name the
   item you picked. If nothing is ready, report what blocks it and stop.

3. **Build it test-first.** Write a failing test, run it and watch it fail,
   make it pass, then tidy up. When a task gives you the test and code, follow
   them as written. Never weaken a test to make it pass. Run the project's
   tests, and update docs when behaviour or usage changes. Done when the item's
   outcome is verified.

4. **Tick it off** only when its own outcome is verified: a milestone when its
   whole outcome is met, not after one task towards it, and a parent only after
   all its children. If the project's status changed, update its README as
   [PROJECTS-README.md](../shared/PROJECTS-README.md) describes.

5. **Report and offer to commit.** Say what was done and what's left, then ask
   whether to commit. If yes, use the commit skill.
