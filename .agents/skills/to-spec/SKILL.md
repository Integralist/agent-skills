---
name: to-spec
description: >-
  Produce a specification document at docs/specifications/ — problem,
  solution, user stories, acceptance criteria, testing seams, and
  scope for a feature. The engineering source-of-truth a plan later
  implements. Use when the user wants a spec or says /to-spec, or
  when another skill needs the spec phase before planning.
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Grep, Read, Write
---

# To Spec

A **spec** is the engineering source-of-truth: *what* to build and the
definition of done. It is stable — it outlives plan revisions — because it
carries **no file paths and no code snippets**. Those go stale, so they belong
to the [`plan`](../project-plan/SKILL.md), where they can be kept current. Spec
is the stable *what*; the plan is the volatile *how*.

Normally invoked by [`architect`](../architect/SKILL.md) after research; also
runs standalone.

## Input

Determine what to specify, in priority order:

1. Invoked from `architect` with a build goal and research context → use those.
1. A spec worked out in the current conversation → capture *that*; do not start
   over.
1. Otherwise → ask the user what to build.

Detect the primary language from the repo so acceptance criteria target the
right test runner; fold the detection into whatever you ask next rather than
blocking on it. Non-code work → language is `N/A`.

## Gather context

Read all `docs/research/*.md`. Explore the codebase to understand current
state, using the project's domain vocabulary, and read `docs/adr/` so the spec
does not contradict a decision already made.

## Identify testing seams

Map where the feature's behaviour will be exercised by tests. A **seam** is a
point where a test observes behaviour:

- Prefer existing seams over new ones.
- Position each seam as high in the architecture as it goes — a boundary (API,
  CLI, HTTP handler) over an internal call.
- The fewer seams, the better; the ideal is one.

Confirm the seams with the user before writing them into the spec.

## Write the acceptance criteria

Feature/boundary behaviour → delegate to
[`behaviour-spec`](../behaviour-spec/SKILL.md), passing the feature description
and language. Take its **acceptance-criteria block** (Gherkin) for the spec's
`## Acceptance Criteria` section. Leave its **scaffold tasks** for the plan —
they are implementation, not spec.

Non-code work (docs, config, operational) → author Given/When/Then prose
directly, verified by checkable assertions (grep, command output, file state);
skip `behaviour-spec`.

## Write the spec

Write to `docs/specifications/<yyyy-mm-dd>-<slug>.md`. Date from `date +%F`,
author from `git config user.name`. A new spec's `Status` is `Draft`.

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

The definition of done — feature-level Given/When/Then. From
`behaviour-spec` for code; prose scenarios verified by
grep/command/file-state for non-code.

```gherkin
Feature: {capability}

  Scenario: {one concrete behaviour}
    Given {a starting state}
    When {an action occurs}
    Then {an observable outcome holds}
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

## Research

- [topic](../research/<yyyy-mm-dd>-topic.md)

## Open Questions

- {Unresolved decisions or risks.}
````

## Guidelines

- The spec stays stable: name interfaces, contracts, schema, and API shape —
  never their file location or an implementation snippet.
- Extract from research and code; do not invent. Cite claims — `path:line` for
  code, URL for docs — and label anything you cannot cite an unverified
  assumption.
- Follow [`markdown-conventions`](../markdown-conventions/SKILL.md) and omit
  needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
