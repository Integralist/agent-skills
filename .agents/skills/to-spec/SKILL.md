---
name: to-spec
description: >-
  Write a project spec: the problem, the solution, and Gherkin acceptance
  criteria, with any delta against the living spec. Use when specifying a
  feature, saving a spec discussed in chat, or when another skill needs a spec.
argument-hint: "[source path]"
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Grep, Read, Write
metadata:
  model-tier: complex
---

# To Spec

Turn a source (a file or this session's discussion) into `spec.md`: what to
build, for whom, and the Gherkin scenarios that define done. A spec is the
stable *what*. It names interfaces, contracts, schema, and API shape, but no
file paths or code; those go stale and belong in the plan. Write the spec;
don't plan or build it.

**Stop and ask.** Follow the source as given, but when something is missing,
contradictory, or looks like the wrong design, tell the user and wait. Don't
fill the gap with a guess.

1. **Pick the source.** Use the file the user names. With none, use this
   session's discussion: capture the spec worked out there rather than
   starting over. If neither says enough to specify, ask. Done when you know
   what is being built, for whom, and why.

2. **Read current truth.** Read any research the source links, the decisions
   in `docs/adr/`, the code the feature touches, and the capability's living
   spec in `docs/specs/` if one exists. A living spec is current truth; without
   one, the code is. Done when you know the behaviour that exists today and the
   decisions the spec must not contradict.

3. **Write the scenarios** as [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md)
   describes. Choose the testing seams: the fewest points where a test
   observes the behaviour, as high as they go (a boundary over an internal
   call), reusing existing ones. If the feature changes behaviour a living spec
   holds, write the Behavioural Delta against it. Done when every behaviour in
   the source has a scenario and every scenario has a seam.

4. **Write the spec** to `spec.md` in the source's project folder, or a new
   `projects/<yyyy-mm-dd>-<slug>/`, filling the template below. Fill the
   header from `date +%F` and `git config user.name`, with Status `Draft`.
   Write the Problem Statement, Solution, and User Stories with the
   voice-product skill. Drop the Behavioural Delta section when no existing
   behaviour changes. Add the spec to the project README as
   [PROJECTS-README.md](../shared/PROJECTS-README.md) describes. Done when the
   file is written and you've shared its path.

````markdown
# {Feature} — Specification

- **Status:** Draft
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language, or N/A}

## Problem Statement

{What is wrong or missing, for whom.}

## Solution

{What will exist when this is done.}

## User Stories

1. As a {actor}, I want {capability}, so that {benefit}.

## Acceptance Criteria

```gherkin
Feature: {capability}

  Scenario: {one concrete behaviour}
    Given {a starting state}
    When {an action occurs}
    Then {an observable outcome holds}
```

## Behavioural Delta

{Baseline and grouped scenarios, per SPEC-FORMAT.md.}

## Testing Seams

- {Seam} — {what it covers, why chosen}

## Implementation Decisions

- {Interface, contract, schema, or API shape, and the decision about it}

## Out of Scope

- {What is excluded, to bound the work}

## Living Specifications

- {[`docs/specs/<capability>.md`](...) — the behaviour it owns, or
  "None — no durable behaviour changes"}

## Research

- {[research](./research.md), or "None"}

## Open Questions

- {Unresolved decisions or risks}
````
