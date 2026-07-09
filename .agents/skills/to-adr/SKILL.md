---
name: to-adr
description: >-
  Extract a formal ADR (Architecture Decision Record) from an
  implementation plan or design doc — one ADR per genuine decision.
  Use when the user wants to record an architecture decision or says
  /to-adr, or when another skill needs to formalize a plan's
  decisions.
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Read, Write
---

# To ADR

Capture a **decision** — a fork that constrains future work, with the
alternatives rejected and the consequences that follow. This skill records
decisions only: the product-facing *what & why* goes to
[`to-prd`](../to-prd/SKILL.md), the engineering source-of-truth to
[`to-spec`](../to-spec/SKILL.md).

Normally invoked by [`project-plan`](../project-plan/SKILL.md) after a plan is
written; also runs standalone.

## Input

1. Path given as an argument → use it.
1. Invoked from another skill that passes a path → use that.
1. Otherwise → most recently modified plan in `docs/plans/`; if ambiguous,
   ask which.

Read the source in full before extracting.

## Value gate

Produce an ADR only for a **genuine decision with a real alternative rejected
for a stated reason**. Mechanical changes, single-obvious-way tasks, and
maintenance work have no fork to record — for those, **produce nothing**: state
why ("no architectural decision with a rejected alternative") and stop. Never
emit an all-placeholder template.

A single plan often holds several distinct decisions — produce **one ADR per
decision**, not one giant ADR.

> [!NOTE]
> Direct `/to-adr` invocation lowers the bar: skip only if the ADR would be
> entirely placeholder, but honour a borderline case the user explicitly asked
> for. The strict gate is for **automatic** invocation from `project-plan`.

## Write the ADR(s)

One file per decision at `docs/adr/<yyyy-mm-dd>-<short-title>.md`. Date from
`date +%F`, author from `git config user.name`.

Template — Nygard skeleton with mandatory **Options Considered**:

```markdown
# {Short decision title}

- **Status**: Accepted
- **Date**: {YYYY-MM-DD}
- **Deciders**: {git config user.name}

## Context

{The forces at play: problem, constraints, requirements that make
this decision necessary. Factual, citation-backed.}

## Decision

{The choice made, in active voice: "We will …".}

## Options Considered

{Every option on the table, chosen one included. For each: a
one-line summary, then why it won or was rejected.}

- **{Option A (chosen)}** — {why it won}
- **{Option B}** — {why rejected}

## Consequences

{What becomes easier and what becomes harder. Follow-on work, new
constraints, risks.}
```

Use `Accepted` for a committed decision, `Proposed` while the plan is still
tentative.

## Report

List the files created and give a one-line summary of each decision recorded.

## Guidelines

- Extract; do not invent. Every statement traces to the source plan or its
  cited research. Missing input for a section → write
  `_Not specified in source._`, never fabricate.
- Cross-link the source plan, and the PRD or spec where relevant.
- Follow [`markdown-conventions`](../markdown-conventions/SKILL.md) and omit
  needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
