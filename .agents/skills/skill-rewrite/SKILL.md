---
name: skill-rewrite
description: >-
  Rewrite an existing skill to be short and readable without losing its core
  behaviour. Use when the user asks to rewrite, simplify, or slim down a skill.
metadata:
  model-tier: moderate
---

Rewrite an existing skill so a human understands its purpose, boundaries, and
deliverable in one pass while giving the agent room to do its best work.
Deliver the revised skill, its references, and any updated links.

**Before rewriting.** Read [writing-for-agents](../writing-for-agents/SKILL.md)
and [REWRITE.md](references/REWRITE.md).

**Approval.** Before editing, show:
1. Combined UTF-8 byte totals before and after (default to a net reduction;
   explain and get approval for any increase).
2. Any behavioural or guardrail relaxations clearly called out so the user
   can keep, adjust, or approve each one.
3. The diff inline (or, for large diffs, a crisp summary plus the choice to
   view the full diff inline or apply).

**Completion.** Run affected tests and link checks, verify callers still match
any changed headings or references, and report what changed plus any unrun
checks.
