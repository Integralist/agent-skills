---
name: skill-rewrite
description: >-
  Rewrite an existing skill to be short and readable without losing its core
  behaviour. Use when the user asks to rewrite, simplify, or slim down a skill.
metadata:
  model-tier: moderate
---

Rewrite an existing skill so the user can understand it in one pass, keeping
agreed behaviour intact. Deliver the revised skill, its supporting references,
and any updated links, rather than suggestions alone.

**Before rewriting.** Read and follow the
[rewrite workflow](references/REWRITE.md) and
[writing-for-agents](../writing-for-agents/SKILL.md).

**Agreement.** Use the user's stated priorities. When none are given, ask
what must stay before showing your own inventory. Settle what to retain,
extract into a reference, transfer to another workflow, or delete.

**Approval.** Show the proposed rewrite and wait for approval before editing.
Show the combined UTF-8 byte totals for the skill and all references, before
and after. Default to a net reduction; get explicit approval for any increase
and explain why it is necessary. For a large diff, offer a summary and the
choice to see the full draft or approve applying it.

**Completion.** Verify preserved behaviour and reference loading, then report
what changed and any unrun checks. Done when the approved rewrite is written,
the agreed changes hold, and no caller points at a removed rule.
