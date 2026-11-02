---
name: distill
description: >-
  Condense long text without losing anything needed to act on it, checked by
  an inventory and audit. Use for a plan, technical guide, runbook, agent
  instructions, or any prose too long or hard to follow, especially before
  an agent executes it.
disable-model-invocation: true
argument-hint: "[file path | pasted text]"
metadata:
  model-tier: moderate
---

Rewrite text to be shorter, clearer, and more direct without losing anything a
reader needs to act safely and accurately. Preservation is the goal; brevity is
the means. A short rewrite can silently lose a path, ordering rule, or edge
case, so inventory the requirements and audit the result.

## Target and approval

- **Pasted text:** Give the rewrite in chat and write nothing to disk.
- **File:** Read it in full, propose the rewrite with its audit, and write
  in-place only after the user approves.
- **Unclear target:** Ask which one the user means.

## Workflow

1. **Inventory.** Read the whole source and checklist every load-bearing item;
   that checklist is the rewrite contract. If source items conflict, record
   only the winning item and note what it supersedes. Finish when the checklist
   covers the whole source.
2. **Rewrite.** Use direct, imperative language and restructure freely into
   lists, tables, or steps. Preserve the information, not the wording or
   layout. Follow [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md), copy paths,
   identifiers, commands, and values verbatim, and add no unsupported facts.
   For a project plan such as `projects/<slug>/plan.md`, retain the structure
   required by [to-plan](../to-plan/SKILL.md) and condense within it. If the
   source is already tight, say so and make only small edits.
3. **Audit.** Compare every checklist item with the rewrite. Restore accidental
   omissions, confirm superseded content is gone, and flag risky cuts rather
   than making them silently. Finish when every item has a disposition in the
   output.

## What to preserve

Keep these load-bearing details; cut filler, repetition, restated context,
over-explanation of the obvious, motivational or apologetic asides, and
off-topic history. When unsure, keep the detail: a spare sentence costs less
than a dropped execution constraint.

| Keep                                    | Cut                              |
| --------------------------------------- | -------------------------------- |
| Exact paths, commands, flags, values    | Filler, throat-clearing, hedging |
| Ordering and sequencing constraints     | Repetition and restated context  |
| Preconditions and dependencies          | Narrative scaffolding           |
| Edge cases, gotchas, and warnings       | Over-explanation of the obvious |
| Acceptance criteria, success conditions | Motivational, apologetic asides  |
| Rationale that prevents a wrong action | Off-topic history                |

## Superseded content

When a document states X and later settles on Y, keep only Y; contradicted
values are hazards. This overrides "when unsure, keep it." Keep a correction's
reason only when it prevents the mistake from recurring (for example, "don't
use X; it breaks Z"). If the winner is unclear (later is usually newer, but not always), tell the
user which version you would choose and why, then proceed unless they say
otherwise.

## Output

Give the rewrite first, then a preservation audit listing every inventory item,
then any deliberate cuts the audit does not already explain. Mark each item:

```txt
- {item}: kept | moved to {where} | cut: {reason}
```

For long or high-stakes text, delegate the independent audit to a fresh
subagent. Follow the
[completion and retry protocol](../shared/SUBAGENT-STEERABILITY.md#completion-and-retry).
Give it only the inventory and rewrite—not your reasoning—and ask it to report
items it cannot find.

## Related skills

- For short prose where clarity matters more than preserving every detail, use
  [polish](../polish/SKILL.md).
- For a repo document's structure and quality, use
  [tech-docs](../tech-docs/SKILL.md).
- To explain an engineering document to a non-engineer, use
  [summarize-for-product](../summarize-for-product/SKILL.md).
