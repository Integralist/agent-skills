---
name: distill
description: >-
  Rewrite text to be more concise, clear, and direct without
  losing critical information. Inventories load-bearing details
  first, rewrites, then audits the rewrite to verify nothing
  essential was dropped. Use to clean up a plan, technical guide,
  agent instructions, or any prose that is too long or hard to
  follow — especially before handing it to an agent to execute.
  Triggers on "clean up / tighten / condense / distill this",
  "make this more concise without losing detail", or /distill.
disable-model-invocation: true
argument-hint: "[file path | pasted text]"
---

# Distill

Rewrite text to be shorter, clearer, and more direct **without losing
any information needed to act on it safely and accurately**.
Preservation is the priority; brevity is the means.

Any condensing pass risks silently dropping a load-bearing detail — an
exact path, an ordering constraint, an edge case. The strict loop below
defends against that: inventory what must survive, rewrite, then audit
the rewrite against the inventory. The audit is the point.

Applies to any text — plans, technical guides, runbooks, agent
instructions, design notes — and is especially valuable before handing a
document to an agent to execute, where a dropped detail becomes a wrong
action.

## Input detection

- **File path given** — read the file in full, then rewrite it in place.
  Per house rules, propose the change (summary, or full diff if asked)
  and get approval *before* writing.
- **Text pasted in chat** — output the rewrite in chat. Write nothing to
  disk.
- **Ambiguous** — ask which the user wants before proceeding.

## Process

Do these in order. Steps 1 and 3 are mandatory and bracket the rewrite —
never skip them.

1. **Inventory load-bearing content (before rewriting).** Read the source
   in full. Extract every must-preserve item into a checklist (see
   [What is load-bearing](#what-is-load-bearing)). This is the contract
   the rewrite must satisfy. When two items conflict, record only the
   authoritative one and note the superseded version so the audit expects
   its absence (see [Superseded content](#superseded-content)).
1. **Rewrite.** Produce a tighter, clearer version. Restructure freely —
   lists, tables, numbered steps — in a direct imperative voice. Fidelity
   is to the *information*, not the original wording or structure.
1. **Audit against the inventory (after rewriting).** Walk every
   checklist item and confirm it survives. An item missing *by accident*
   must be restored; an item *superseded* by a later correction must be
   confirmed absent, not restored. This step is the guarantee.

## What is load-bearing

Preserve everything in the left column. Cut freely from the right.

| Preserve (load-bearing)                 | Safe to cut (decorative)         |
| --------------------------------------- | -------------------------------- |
| Exact paths, commands, flags, values    | Filler, throat-clearing, hedging |
| Ordering and sequencing constraints     | Repetition and restated context  |
| Preconditions and dependencies          | Narrative scaffolding            |
| Edge cases, gotchas, and warnings       | Over-explanation of the obvious  |
| Acceptance criteria, success conditions | Motivational/apologetic asides   |
| Rationale that prevents a wrong action  | Off-topic historical context     |

> [!WARNING]
> When unsure whether a detail is load-bearing, treat it as load-bearing.
> A retained sentence costs little; a dropped constraint can break
> execution.

## Superseded content

A document often records its own evolution: it asserts X, then later
establishes X was wrong and the answer is Y. Keep only the resolved
conclusion (Y). Drop the original assumption (X) and the back-and-forth
that reached it — the executor needs the destination, not the journey.

- This **overrides** the "when unsure, preserve" default: a contradicted
  assumption is not load-bearing, it is a hazard that invites acting on
  the wrong value.
- Preserve a correction's *reasoning* only when it prevents
  re-introducing the mistake (e.g. "do not use X; it breaks Z"). Then the
  conclusion is "use Y" and the rationale rides along.
- **When it is unclear which version wins**, do not guess silently. Later
  position usually means more recent thinking, but not always. Flag the
  conflict to the user with your recommended winner and reason, and
  proceed on that recommendation unless told otherwise.

## Rewrite principles

- Omit needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md). Cut anything
  that survives removal without loss of meaning.
- Use a direct, imperative voice for instructions.
- Restructure into lists, tables, or steps wherever that helps an
  executor. Structure may change completely; meaning may not.
- Preserve technical accuracy exactly. Never invent, infer, or "improve"
  facts not in the source.
- Keep exact tokens verbatim — paths, identifiers, commands, and values
  are copied, never paraphrased.

## Output

**For pasted text**, present in this order:

1. The rewritten text.

1. A **Preservation audit** — each inventory item with its fate:

   ```txt
   - {item} — kept | relocated to {where} | cut: {reason}
   ```

1. A short list of anything deliberately dropped, if not already clear
   from the audit.

**For a file**, summarize the changes (including the preservation audit),
get approval, then write.

## Guardrails

- If the text is already tight, say so and make only minimal edits. Do
  not manufacture cuts to look productive.
- If cutting an item is risky, flag it for the user instead of silently
  dropping it.
- If the source is a `docs/plans/` project-plan document, keep its
  required structure intact — see
  [`project-plan`](../project-plan/SKILL.md). Condense within the
  structure rather than collapsing it.

## Optional rigor: independent audit

For long or high-stakes text, delegate step 3 to a fresh subagent (if
your harness supports it). Give it *only* the original load-bearing
inventory and the rewritten text — not the rewriting rationale — and ask
it to report any inventory item it cannot find. A reviewer unaware of the
rewriter's intentions catches omissions the rewriter rationalized away.

## Related skills

- [`tech-docs`](../tech-docs/SKILL.md) — improving repo *documentation*
  via doc-specific pillars (Mermaid diagrams, modularization, eliminating
  assumptions, stale-code references). Use it for document structure and
  quality; use `distill` as its deeper-condensing companion when
  preserving every load-bearing detail is the concern.
- [`summarize-for-product`](../summarize-for-product/SKILL.md) —
  different goal: translate an engineering doc for a non-engineer
  audience. That reshapes content for a reader; `distill` preserves all
  content for an executor.
