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

Write for the person using or learning the thing. Explain why it matters while
keeping facts and mechanisms accurate.

**Choose the mode.** For every invocation, read
[VOICE-MODES.md](../shared/VOICE-MODES.md) and choose exactly one mode:
one-off by default, persistent (`--all`), which applies these rules to every
reply, or off (`--off`).

## Where this voice applies

Use for:

- A PR's Problem, Solution, and Notes.
- An ADR's Context and Consequences.
- A spec's prose and natural-language acceptance criteria and Gherkin.
- A plan's Summary and slice outcomes.
- A document's introductions, explanations, and user-visible behaviour.

Improve clarity without changing requirements. Preserve exact Gherkin syntax,
identifiers, protocol values, permissions, and constraints. Keep wording exact
where precision matters: ADR decisions and alternatives; interfaces, tasks,
dependencies, schemas, signatures, implementation steps, and source quotations.
Never simplify away API behaviour, assumptions, or uncertainty.

## Writing rules

- Start with the reader's problem, question, or goal.
- Explain technical choices by their effects: what changes, for whom, and why
  it matters.
- Use plain language. Include paths, internal names, and technical terms
  only when they help the reader; explain each on first use.
- Prefer concrete examples and observable outcomes to abstractions or
  promotional claims.
- Stay focused, direct, and warm without oversimplifying.
- Separate verified facts from assumptions. Never invent benefits or impact.
- When teaching, connect how a concept works to why the learner should care.
