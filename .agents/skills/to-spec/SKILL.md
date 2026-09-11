---
name: to-spec
description: >-
  Produce a functional specification defining problem, solution, and
  acceptance criteria. Use when specifying a feature or when another skill
  needs the spec phase before planning.
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Grep, Read, Write
---

# To Spec

A **spec** is the engineering source-of-truth: *what* to build and the
definition of done. It is stable — it outlives plan revisions — because it
carries **no file paths and no code snippets**. Those go stale, so they belong
to the [`plan`](../to-plan/SKILL.md), where they can be kept current. Spec
is the stable *what*; the plan is the volatile *how*.

Normally invoked by [`architect`](../architect/SKILL.md) after research; also
runs standalone.

## Input

Determine what to specify, in priority order:

1. Invoked from `architect` with a build goal and research context → use those.
1. A spec worked out in the current conversation → capture *that*; do not start
   over.
1. Otherwise → ask the user what to build; if the request is vague, elicit
   intent first via [`clarify`](../clarify/SKILL.md).

Detect the primary language from the repo so acceptance criteria target the
right test runner; fold the detection into whatever you ask next rather than
blocking on it. Non-code work → language is `N/A`.

## Gather context

Read any existing project research (`projects/<project-dir>/research.md` or
`docs/research/*.md`). Explore the codebase to understand current state, using
the project's domain vocabulary, and read `docs/adr/` so the spec does not
contradict a decision already made. Inspect `docs/specs/` for an existing living
spec covering the capability; if present, read it as current truth. If absent,
the codebase is current truth and this project will seed the living spec.

## Identify testing seams

Map where the feature's behaviour will be exercised by tests. A **seam** is a
point where a test observes behaviour:

- Prefer existing seams over new ones.
- Position each seam as high in the architecture as it goes — a boundary (API,
  CLI, HTTP handler) over an internal call.
- The fewer seams, the better; the ideal is one.
- Seams establish deep module boundaries: tests observe behavior at the public
  interface (grey box), leaving internal implementations free to evolve without
  breaking the test harness.

Confirm the seams with the user before writing them into the spec.

## Write the acceptance criteria

Delegate to [`behaviour-spec`](../behaviour-spec/SKILL.md), passing the feature
description and language (`N/A` for non-code or operational work). Take its
**acceptance-criteria block** (rendered in a fenced ` ```gherkin ` code block)
for the spec's `## Acceptance Criteria` section. Leave its **scaffold tasks**
for the plan — they are implementation, not spec.

## Write the spec

Ensure `projects/README.md` exists. If missing, create it from
[`../shared/PROJECTS-README.md`](../shared/PROJECTS-README.md).

Write the initiative-scoped delta spec to
`projects/<yyyy-mm-dd>-<slug>/spec.md`. Date from `date +%F`, author from
`git config user.name`. A new spec's `Status` is `Draft`; the transition to
`Complete` and the move to `projects/completed/<yyyy-mm-dd>-<slug>/` happen at
commit time — see [`commit`](../commit/SKILL.md). This document records the
delta—problem, proposed solution, and acceptance criteria for this initiative.
Net behaviour changes fold into the living spec at `docs/specs/<capability>.md`
when the implementation ships (seed if new, update if existing).

````markdown
# {Feature Name} — Specification

- **Status**: Draft
- **Author**: {git config user.name}
- **Created**: {YYYY-MM-DD}
- **Language**: {confirmed language, or "N/A" for non-code}

## Problem Statement

{User-facing description of what is wrong or missing.}

## Solution

{User-facing description of what will exist when this is done.}

## User Stories

1. As a {actor}, I want {capability}, so that {benefit}.

## Acceptance Criteria

The definition of done — feature-level Given/When/Then from
`behaviour-spec`, rendered in a fenced `gherkin` code block. Verification
is by test runner for code, or checkable assertions (grep, command output,
file state) for non-code and operational work.

```gherkin
Feature: {capability}

  As a {actor}
  I want {capability}
  So that {benefit}

  Scenario: {one concrete behaviour}
    Given {a starting state}
    When {an action occurs}
    Then {an observable outcome holds}
    And {another observable outcome}
```

## Testing Seams

Where this feature's behaviour is exercised. Prefer existing seams,
positioned high; ideal count is one.

- {Seam} — {what it covers, why chosen}

## Implementation Decisions

Interfaces, contracts, schema changes, and API shape — **no file
paths, no code snippets** (those live in the plan).

- {Module / interface / contract, and the decision about it}

## Out of Scope

- {Explicitly excluded, to bound the work.}

## Capability Spec

- `docs/specs/<capability>.md`

## Research

- [research](./research.md) (or `docs/research/<yyyy-mm-dd>-topic.md`)

## Open Questions

- {Unresolved decisions or risks.}
````

## Guidelines

- The spec stays stable: name interfaces, contracts, schema, and API shape —
  never their file location or an implementation snippet.
- Extract from research and code; do not invent. Cite claims — `path:line` for
  code, URL for docs — and label anything you cannot cite an unverified
  assumption.
- Follow [`conventions-markdown`](../conventions-markdown/SKILL.md) and omit
  needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
- If including Mermaid diagrams, follow
  [`conventions-mermaid`](../conventions-mermaid/SKILL.md) and validate with
  `mmdc`.
- Render all Given/When/Then acceptance criteria in GitHub Flavoured Markdown
  fenced `gherkin` code blocks. Never render scenarios as plain prose or
  Markdown headings.

## Next step

Once the spec is complete, proceed to grilling via
[`grill-with-docs`](../grill-with-docs/SKILL.md) to stress-test the design
before planning.

## Standing capability specs in `docs/specs/`

Standing specs live in `docs/specs/<capability>.md` and define current truth:

- **Title:** `# {Capability Name}` (e.g. `# Deployment`). Never append "Living
  Specification" or "Spec" — the directory already declares what it is.
- **Content:** Lasting contracts, invariants, and Given/When/Then scenarios.
  Omit transient project metadata (Problem Statement, Out of Scope, author,
  dates).
- **Reference in project spec:** Under `## Capability Spec`, cite only the path
  `- docs/specs/<capability>.md`. Do not copy instructional text into the
  document.
