---
name: extract-doc
description: >-
  Extract a formal ADR (Architecture Decision Record) and/or PRD
  (Product Requirements Document) from an existing implementation
  plan or design doc. Auto-detects which format(s) fit the source.
  Use when the user wants to formalize a plan into an ADR or PRD,
  generate an architecture decision record, create a product
  requirements document, or says /extract-doc.
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Read, Write
---

# Extract Doc

Turn an implementation plan (or any design doc) into formal records: an
**ADR**, a **PRD**, or both. A plan mixes *what to build* (product framing)
with *how and why* (architectural decisions); this skill separates those into
the right artifacts.

## Input

Identify the source document:

1. Path given as an argument → use it.
1. Otherwise → most recently modified plan in `docs/plans/`. If the choice is
   ambiguous, prompt the user to pick.
1. Invoked from another skill that passes a path → use that.

Read the source in full before extracting.

## Phase 1: Detect which document(s) to produce

**Value gate** — a document is worth producing only when:

- An **ADR** captures a genuine decision with a real alternative rejected for a
  stated reason — a fork that constrains future work. Mechanical changes,
  single-obvious-way tasks, and maintenance work have no decision to capture.
- A **PRD** captures a product/user surface with goals or success criteria
  worth framing independently of the plan. Internal refactors, tooling, and
  documentation work have no product surface.

If the source clears neither bar, **produce nothing**: state why ("no
architectural decision with a rejected alternative; no user-facing product
surface") and stop. Do not emit an all-placeholder template.

> [!NOTE]
> When invoked **directly by the user** (`/extract-doc`), lower the bar —
> still skip a document only if it would be entirely placeholder, but do not
> refuse a borderline case the user explicitly asked for. The strict gate
> applies to **automatic** invocation from `project-plan` / `research-plan`.

If at least one bar is met, classify against these signals.

**PRD signals** (product framing — *what & why for users*):

- Describes a user-facing feature, product, or capability.
- States goals, success metrics, or business value.
- Defines scope, audience, or non-goals.

**ADR signals** (architecture — *how & why technically*):

- Records technical decisions (technology, pattern, schema, interface,
  trade-off).
- Has rejected alternatives, caveats, or risk discussion.
- Constrains future implementation.

Decide: product framing only → **PRD**; technical decisions only →
**ADR(s)**; both present → **both** (typical for a full plan).

State the classification and which files will be produced, then proceed. Do not
block on confirmation — if the user disagrees they will redirect. (From
`research-plan`, this is fully automatic.)

> [!NOTE]
> A single plan often contains several distinct architectural decisions.
> Produce **one ADR per decision**, not one giant ADR.

## Phase 2: Write the ADR(s)

ADRs live in `docs/adr/`, one file per decision:
`docs/adr/<yyyy-mm-dd>-<short-title>.md` (date prefix matches the convention
used by `research` and `decide` output). Get today's date with `date +%F`.

Template (Nygard skeleton + mandatory **Options Considered**):

```markdown
# {Short decision title}

- **Status**: Accepted
- **Date**: {YYYY-MM-DD}
- **Deciders**: {author from git config user.name}

## Context

{The forces at play: the problem, constraints, and requirements
that make this decision necessary. Factual, citation-backed.}

## Decision

{The choice that was made, stated in active voice: "We will …".}

## Options Considered

{Mandatory. Every option that was on the table, including the
chosen one. For each: a one-line summary, then why it was chosen
or rejected.}

- **{Option A (chosen)}** — {why it won}
- **{Option B}** — {why rejected}
- **{Option C}** — {why rejected}

## Consequences

{What becomes easier and what becomes harder as a result. Include
follow-on work, new constraints, and risks.}
```

Status is `Accepted` when the plan reflects a committed decision; use
`Proposed` if the plan is still tentative.

## Phase 3: Write the PRD

PRDs live in `docs/prd/<yyyy-mm-dd>-<slug>.md` (one per product/feature). Get
today's date with `date +%F`.

```markdown
# {Product / Feature Name} — PRD

- **Status**: Draft
- **Author**: {author from git config user.name}
- **Created**: {YYYY-MM-DD}

## Overview

{The problem and the proposed solution in one paragraph —
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

- {What the system must do — user-observable behavior.}

### Non-Functional

- {Performance, security, reliability, compliance constraints.}

## Success Metrics

- {How success is measured.}

## Open Questions

- {Unresolved decisions or risks.}

## References

- Source plan: [{plan name}](../plans/{plan-filename}.md)
- {Linked research docs, if any.}
```

## Phase 4: Report

List the files created with their paths. For ADRs, give a one-line summary of
each decision recorded.

## Guidelines

- Extract; do not invent. Every statement must trace to the source plan or its
  cited research. If the plan lacks something a section needs (e.g. success
  metrics), write `_Not specified in source._` rather than fabricating.
- Omit needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
- Keep ADRs small and single-purpose — one decision each.
- PRDs stay implementation-agnostic; push the "how" into ADRs.
- Cross-link: PRD references the plan; ADRs reference the PRD or plan where
  relevant.
- Wrap all Markdown output at 80 columns.
- Follow the project's Markdown conventions (bullet lists for metadata label
  lines, language identifiers on code blocks).
