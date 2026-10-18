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

# Distill

Rewrite text to be shorter, clearer, and more direct without losing anything
a reader needs to act on it safely and accurately. Preservation is the goal
and brevity the means: any condensing pass can silently drop an exact path,
an ordering constraint, or an edge case, and before an agent executes a
document, a dropped detail becomes a wrong action. So inventory what must
survive, rewrite, then audit the rewrite against the inventory; the audit is
the point.

**Target.** For pasted text, give the rewrite in chat and write nothing to
disk. For a file, read it in full, propose the change with the audit, and
write it in place only once the user approves. Ask when it's unclear which.

1. **Inventory** every load-bearing item in the source as a checklist, the
   contract the rewrite must meet. When two items conflict, record only the
   one that wins and note the superseded one, so the audit expects it gone.
   Done when the whole source is read and the checklist written.
2. **Rewrite** in a direct, imperative voice, restructuring freely into
   lists, tables, or steps: fidelity is to the information, not the wording
   or layout. Omit needless words, following
   [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md), copy paths, identifiers,
   commands, and values verbatim, and add no fact the source lacks. For a
   project plan such as `projects/<slug>/plan.md`, keep the structure
   [to-plan](../to-plan/SKILL.md) requires and condense within it. If the
   text is already tight, say so and make only small edits. Done when the
   rewrite is drafted.
3. **Audit** each checklist item against the rewrite. Restore anything
   missing by accident, confirm anything superseded is gone, and flag to the
   user any cut that's risky rather than making it silently. Done when every
   item has a fate in the output below.

**Load-bearing.** Keep everything in the left column; cut freely from the
right. When unsure, keep it: a spare sentence costs little, a dropped
constraint can break execution.

| Keep                                    | Cut                              |
| --------------------------------------- | -------------------------------- |
| Exact paths, commands, flags, values    | Filler, throat-clearing, hedging |
| Ordering and sequencing constraints     | Repetition and restated context  |
| Preconditions and dependencies          | Narrative scaffolding            |
| Edge cases, gotchas, and warnings       | Over-explanation of the obvious  |
| Acceptance criteria, success conditions | Motivational, apologetic asides  |
| Rationale that prevents a wrong action  | Off-topic history                |

**Superseded content.** When a document asserts X and later settles on Y,
keep only Y and drop X and the back-and-forth: a contradicted value is a
hazard, so this overrides "when unsure, keep it". Keep a correction's
reasoning only when it stops the mistake coming back ("don't use X; it
breaks Z"). When it's unclear which version wins (later usually means more
recent, but not always), tell the user which you'd pick and why, and go
ahead on that unless they say otherwise.

**Output.** The rewrite, then a preservation audit with every inventory
item, then anything deliberately dropped that the audit doesn't already make
clear:

```txt
- {item}: kept | moved to {where} | cut: {reason}
```

**Independent audit.** For long or high-stakes text, hand step 3 to a fresh
subagent, following the
[completion and retry protocol](../shared/SUBAGENT-STEERABILITY.md#completion-and-retry).
Give it only the inventory and the rewrite, not your reasoning, and ask it to
report any item it can't find; a reviewer who doesn't know your intentions
catches omissions you rationalised away.

**Related skills.** For short prose where clarity matters more than
preservation, use [polish](../polish/SKILL.md). For a repo document's
structure and quality, use [tech-docs](../tech-docs/SKILL.md). To explain an
engineering document to a non-engineer, use
[summarize-for-product](../summarize-for-product/SKILL.md).
