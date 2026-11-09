# Spec writing guide

Read before drafting prose or acceptance criteria.

## Reader path and clarity check

Start Development Brief with a short summary of the request, boundaries and
open choices. Preserve original requests/decisions as fixed-revision links or
verbatim evidence; optionally collapse long history. Redact secrets.

User stories describe capabilities, not fixtures, except for testing/operator
stories. Explain roles/terms before using them; follow the glossary without
copying its editorial notes into the spec.

Before handoff, check the whole initial draft, including tables, technical
sections and Gherkin:

1. Can a fresh reader identify actor, action, permissions, outcome and open
   decisions? Explain acronyms, objects and scenario prefixes once; link
   relevant source code.
2. State each obligation once; link repetitions. Separate Research from Open
   Questions. Keep unique contracts here until a linked durable home exists;
   replaceable tasks belong in the plan. Dropdowns do not replace criteria.
3. Preserve IDs, protocol values, ownership, timing, failures and uncertainty.
   If unclear wording exposes an undecided requirement, ask; do not write it
   as settled.

## Scenarios and scope

Follow [SPEC-FORMAT.md](../../shared/SPEC-FORMAT.md). Include technical details
only when they define a required interface, security guarantee or operational
constraint. A component name or call restriction belongs in a scenario only
if changing it would violate the requirement.

Acceptance Criteria states observable behaviour; Testing Seams names the
highest reusable boundary where tests observe it, not an internal call.
Living Specifications assigns each durable scenario to an owning
`docs/specs/<capability>.feature` file loaded directly by acceptance runners.

For changed living behaviour, record a Behavioural Delta against a pinned
baseline. Include agreed constraints and failures; leave new risks and
undecided responses in Open Questions.

## Spec template

````markdown
# {Feature} — Specification

- **Status:** Draft
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language, or N/A}

## Development Brief

{Current request, agreed boundaries and open choices. Preserve original
requests/clarifications here or link fixed-revision evidence; collapse long
source history, not requirements.}

## Problem Statement

{What is missing, for whom.}

## Solution

{What will exist when done.}

## User Stories

1. As a {actor}, I want {capability}, so that {benefit}.

## Acceptance Criteria

```gherkin
Feature: {reader-visible capability}

  Scenario: {one required outcome}
    Given {relevant starting state}
    When {an actor acts}
    Then {an observable result or required guarantee holds}
```

## Behavioural Delta

{Baseline and grouped scenarios per SPEC-FORMAT.md; omit if unchanged.}

## Testing Seams

- {Boundary — what it proves and why chosen}

## Implementation Decisions

- {Required interface, contract, schema or API shape and rationale}

## Out of Scope

- {Exclusions}

## Living Specifications

- {Existing owning feature link and behaviour, inline-code future path,
  or "None — no durable behaviour changes"}

## Research

- {[research](./research.md), or "None"}

## Open Questions

- {Unresolved decisions/risks, or "None"}
````
