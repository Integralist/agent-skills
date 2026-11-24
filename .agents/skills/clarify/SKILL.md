---
name: clarify
description: >-
  Turn an under-specified request into a clear brief before acting. Use
  whenever a task leaves room to guess—missing goal, pass/fail check, scope,
  examples, target location, or multiple valid approaches—without needing a
  full grilling session. Also use when another skill hits an ambiguous ask.
metadata:
  model-tier: moderate
---

Ask only for what the user knows and the codebase or context cannot answer.
Follow [EXECUTIVE-SCAFFOLDING.md](../shared/EXECUTIVE-SCAFFOLDING.md).

1. **Check context first.** Inspect relevant files, docs, or repo rules
   before asking—start from the rawest material (source, schemas, logs, or
   traces) rather than summaries. Do not ask for facts you can verify yourself.
2. **Ask 1 to 4 numbered questions** in one round—skip anything already
   clear or safe to decide yourself. Target only missing brief items:
   - **Goal & bar:** Outcome, real numbers, or examples of good.
   - **Problem shape:** If the ask could mean 2–3 distinct classic problems,
     name the candidate shapes and the sign that tells them apart.
   - **Pass/fail check:** An external check independent of our own judgment
     (test, command, contract, or measured output).
   - **Target & bounds:** Where it goes, scope limits, or preferred option.

   Suggest a default for each question so the user can confirm in a word. If
   deep design trade-offs surface, hand off to [grilling](../grilling/SKILL.md).
3. **Restate and go.** Restate the settled goal, check, and target in a few
   lines, then start (or confirm a plan first for non-trivial changes).
