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

1. Can a fresh reader identify the actor, action, permissions, outcome and
   open decisions? When a requirement spans identity domains, distinguish the
   identities and state which one controls each decision. At first mention,
   name each component and explain its role; use shorthand only after the
   component is clear. If the proposal expands an existing component,
   distinguish what it does today from the proposed responsibility. Explain
   only the terms needed to understand the contract; link relevant source code.
2. State each obligation once; link repetitions. Separate Research from Open
   Questions. Keep unique contracts here until a linked durable home exists;
   replaceable tasks belong in the plan. Dropdowns do not replace criteria.
3. Preserve externally referenced IDs, protocol values, ownership, timing,
   failures and uncertainty. Use descriptive scenario titles by default; add
   IDs or lookup tables only when external references need them. Check each
   `Rule` against its child scenarios; put setup in `Given` unless environment
   changes behaviour. Ask rather than settle unclear needs.

## Scenarios and scope

Follow [SPEC-FORMAT.md](../../shared/SPEC-FORMAT.md). Include technical details
only when they define a required interface, security guarantee or operational
constraint. A component name or call restriction belongs in a scenario only
if changing it would violate the requirement.

Acceptance Criteria states observable system behaviour; Testing Seams names
the highest reusable boundary where tests observe it, not an internal call.
Keep test-harness and deployment details out of accepted behaviour; see
[SPEC-FORMAT.md](../../shared/SPEC-FORMAT.md) for their placement.
Living Specifications assigns each durable scenario to an owning
`docs/specs/<capability>.feature` file loaded directly by acceptance runners.

For changed living behaviour, follow the Behavioural Delta format below.

### Tables, prose and lists

Use a table when repeated facts are easier to compare or scan, such as component
roles, terminology, feature gates, or state ownership. Keep explanations,
reasoning, and flows in prose. Use numbered lists for ordered steps and user
stories; use bullets for unordered items. Do not force long explanations into
table cells.

### Metadata

Keep metadata concise. Use a table with Status, Author, Created and Language.
Add Project, Baseline and Decision status rows only when they help orient the
reader. Language names the primary implementation language; put fixture and
runtime languages elsewhere. Baseline rows may use short SHAs that resolve
uniquely in the named repository; keep full SHAs in pinned source links. Follow
[Markdown conventions](../../conventions-markdown/SKILL.md). Use a clear label
such as `Decision status`, not an ambiguous label such as `Authority`.

## Spec template

````markdown
# {Feature} — Specification

| Field | Value |
| --- | --- |
| Status | Draft |
| Author | {git config user.name} |
| Created | {date +%F} |
| Language | {primary implementation language, or N/A} |

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

{Observable scenarios in fenced Gherkin; see SPEC-FORMAT.md.}

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
