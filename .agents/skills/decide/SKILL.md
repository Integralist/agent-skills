---
name: decide
description: >-
  Decision memo with a contrarian check, saved to docs/decisions/. Use when
  the user wants help making a consequential, hard-to-reverse, or
  multi-stakeholder decision.
argument-hint: "[steering]"
metadata:
  model-tier: complex
---

Help the user think through a consequential decision and save a grounded
decision memo to `docs/decisions/YYYY-MM-DD-<slug>.md` (overwriting/revising
if re-run on the same decision). Separate verified facts from assumptions,
challenge blind spots with a fresh contrarian pass, and name explicit kill
criteria.

## Workflow

1. **Frame and interview.** Follow
   [EXECUTIVE-SCAFFOLDING.md](../shared/EXECUTIVE-SCAFFOLDING.md). Gather
   missing context in 1–2 concise rounds (batching related questions and
   skipping anything already answered):
   - **Decision & timing:** What is being decided, why now, and what happens
     if you do nothing?
   - **Options & reversibility:** Viable paths (always include status quo),
     one-way vs. two-way door, and what must be true for each option to work.
   - **Stakeholders & gut call:** Who must buy in (if not a solo call), what
     you're currently leaning toward, and what would change your mind.
2. **Verify and stress-test.** Do not invent facts; label every claim as
   *Verified fact*, *User belief*, *Assumption*, or *Unknown*:
   - **Verify claims (when applicable):** If the decision depends on codebase
     facts, repo history, or external docs, verify them read-only (inline or
     via a read-only subagent per
     [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md)).
   - **Independent contrarian pass:** Run a fresh read-only subagent (or
     explicit cold-eyes pass if subagents are unavailable) given the options,
     evidence ledger, and gut call to steel-man the alternatives, expose
     hidden assumptions, sunk costs, selection bias, and second-order effects,
     and test reversibility.
3. **Draft and confirm.** Read
   [MEMO-TEMPLATE.md](references/MEMO-TEMPLATE.md), and read and follow
   [voice-product](../voice-product/SKILL.md). Omit sections that don't apply
   (e.g. `Stakeholders` for a solo call). Show the draft or concise summary
   with the recommendation, trade-offs, and kill criteria; wait for approval
   before writing `docs/decisions/YYYY-MM-DD-<slug>.md`.
