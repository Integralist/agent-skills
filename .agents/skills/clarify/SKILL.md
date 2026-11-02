---
name: clarify
description: >-
  Pin down the user's intent before starting work. Use when a request is too
  vague to act on ("help me with this", "I need something", "let's work
  on…"), or when another skill hits a vague request.
metadata:
  model-tier: trivial
---

Before acting, use one structured interaction to pin down what the user wants.
Keep the questions few and follow
[EXECUTIVE-SCAFFOLDING.md](../shared/EXECUTIVE-SCAFFOLDING.md).

1. **Ask only for missing information:**
   - **Audience:** Who is this for?
   - **Goal:** What do they need?
   - **Context:** What should you know?
   - **Constraints:** What are the boundaries?
   - **Format:** What should the output look like?

   Continue when all five have answers, including answers already given in the
   conversation.
2. **Restate** the five answers to the user, then continue with the task.
