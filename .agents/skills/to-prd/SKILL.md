---
name: to-prd
description: >-
  Extract a focused PRD (Product Requirements Document) — the
  product-facing what & why — from a spec or plan. Use when the user
  wants a PRD, product framing, goals and success metrics, or says
  /to-prd, or when another skill offers to produce one.
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Read, Write
---

# To PRD

Frame a feature for a product/stakeholder audience: the problem, the goals, who
it serves, how success is measured. A PRD is smaller and more focused than a
[`spec`](../to-spec/SKILL.md) — it **sources from the spec and does not restate
it**. Keep the *how* out; that lives in [`to-adr`](../to-adr/SKILL.md) and the
plan.

Offered by [`architect`](../architect/SKILL.md) after the spec; also runs
standalone.

## Input

1. Path given as an argument → use it.
1. Invoked from another skill that passes a path → use that.
1. Otherwise → most recently modified spec in `docs/specifications/`, else plan
   in `docs/plans/`; if ambiguous, ask which.

Read the source in full before extracting.

## Value gate

Produce a PRD only when there is a **product surface with goals worth framing
independently of what the spec already says** — measurable goals, success
metrics, audience, non-goals. Internal refactors, tooling, and documentation
work have no such surface.

If a PRD would merely paraphrase the spec's Problem/Solution/User Stories,
**produce nothing**: say so and stop. The PRD earns its place only by adding
framing the spec lacks.

> [!NOTE]
> Direct `/to-prd` invocation lowers the bar: honour a borderline case the user
> explicitly asked for, skipping only an all-placeholder result.

## Write the PRD

One file at `docs/prd/<yyyy-mm-dd>-<slug>.md`. Date from `date +%F`, author from
`git config user.name`.

```markdown
# {Product / Feature Name} — PRD

- **Status**: Draft
- **Author**: {git config user.name}
- **Created**: {YYYY-MM-DD}

## Overview

{Problem and proposed solution in one paragraph —
implementation-agnostic.}

## Background & Problem

{Why this matters now. Who is affected and how.}

## Goals

- {Measurable goal}

## Non-Goals

- {Explicitly out of scope}

## Users & Use Cases

{Who uses this and the scenarios they need it for.}

## Requirements

### Functional

- {What the system must do — user-observable behaviour.}

### Non-Functional

- {Performance, security, reliability, compliance constraints.}

## Success Metrics

- {How success is measured.}

## Open Questions

- {Unresolved decisions or risks.}

## References

- Source: [{spec or plan name}](../specifications/{filename}.md)
```

## Report

List the file created with its path.

## Guidelines

- Extract; do not invent. Every statement traces to the source. Missing input
  for a section → write `_Not specified in source._`, never fabricate.
- Stay implementation-agnostic — push the *how* into ADRs and the plan.
- Follow [`markdown-conventions`](../markdown-conventions/SKILL.md) and omit
  needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
