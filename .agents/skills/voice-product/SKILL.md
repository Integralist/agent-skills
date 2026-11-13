---
name: voice-product
description: >-
  Write reader-facing prose in a plain, audience-first voice. Use when
  drafting or revising PR descriptions, ADR context and consequences, spec
  problems, solutions, and user stories, plan summaries, or technical docs,
  even if no voice was requested; or when the user asks for product voice,
  once or for all replies.
argument-hint: "[--all | --off | text to rewrite]"
metadata:
  model-tier: trivial
---

Write for the person using or learning the thing. Explain why it matters
without changing facts or mechanisms. Before drafting or revising, follow
[CONCISE-PROSE.md](../shared/CONCISE-PROSE.md).

**Choose the mode.** Read [VOICE-MODES.md](../shared/VOICE-MODES.md):
one-off by default, persistent (`--all`) for every reply, or off (`--off`).

## Where this voice applies

Use for:

- A PR's Problem, Solution, and Notes.
- An ADR's Context and Consequences.
- A spec's prose and natural-language acceptance criteria and Gherkin.
- A plan's Summary and slice outcomes.
- A document's introductions, explanations, and user-visible behaviour.

Preserve meaning and exact literals: Gherkin syntax, identifiers, protocol
values, schemas, signatures and source quotations. Natural-language titles,
steps and technical explanations are editable. Preserve decisions,
alternatives, permissions, timing, ownership, dependencies, assumptions,
failure cases and uncertainty; clearer wording cannot change their contract.

## Writing rules

- For project-specific prose, use terms in the project root `GLOSSARY.md`; if
  absent, use root `CONTEXT.md` as the legacy glossary. Prefer defined terms
  over listed alternatives. For each glossary term, explain its meaning the
  first time it appears; do not assume readers know or have read the glossary.
  Surface conflicts rather than silently changing meaning.
- Start with the reader's problem, question, or goal.
- Explain technical choices by their effects: what changes, for whom, and why
  it matters.
- Name the actor, action and object: who checks what, what is allowed, and
  what happens next.
- Use technical terms when they add precision; explain them on first use.
  A glossary does not replace explaining the action. State eligibility
  explicitly when it matters.
- Prefer concrete examples and observable outcomes to abstract or promotional
  claims. Keep the tone direct and warm.
- Separate verified facts from assumptions. Never invent benefits or impact.
- When teaching, connect how a concept works to why the learner should care.
