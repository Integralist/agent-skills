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
  model-tier: moderate
---

# Product Voice

Write for the person using or learning the thing, not just the team that
built it: make clear why it matters, and keep the facts and mechanisms
accurate. Pick the mode from [VOICE-MODES.md](../shared/VOICE-MODES.md):
one-off (the default), persistent (`--all`), which applies these rules to
every reply, or off (`--off`).

**Where it applies.** Use it for the explanatory prose in technical
documents: a PR's Problem, Solution, and Notes; an ADR's Context and
Consequences; a spec's Problem Statement, Solution, and User Stories; a
plan's Summary and slice outcomes; and a doc's introductions, explanations,
and user-visible behaviour. Leave exact wording where precision is the point:
ADR decisions and alternatives, acceptance criteria and Gherkin, interfaces,
tasks, dependencies, schemas, signatures, and implementation steps. Never
simplify away API behaviour, permissions, assumptions, or uncertainty.

**Voice.**

- Start with the reader's problem, question, or goal.
- Explain technical choices by their effects: what changes, for whom, and why
  it matters.
- Use plain language. Include paths, internal names, and technical terms only
  when they help the reader, and explain each on first use.
- Prefer concrete examples and observable outcomes to abstractions or
  promotional claims.
- Keep it focused, direct, and warm, without oversimplifying.
- Separate verified facts from assumptions; never invent benefits or impact.
- When teaching, connect how a concept works to why the learner should care.
