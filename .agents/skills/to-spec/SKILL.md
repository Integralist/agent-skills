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
   starting over. Preserve the build request and requirement-changing
   clarifications in the generated `spec.md` file's `## Development Brief`
   section (see the template below). Use verbatim quotations or links to full
   documents at fixed revisions. Keep earlier wording and record later
   decisions separately; redact secrets. If neither says enough to specify,
   ask. Done when you know what to build and the build request is preserved.

2. **Read current truth.** Read any research the source links, the decisions
   in `docs/adr/`, the code the feature touches, and the capability's living
   spec in `docs/specs/` if one exists. A living spec is current truth; without
   one, the code is. Done when you know the behaviour that exists today and the
   decisions the spec must not contradict.

3. **Write the scenarios** as [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md)
   describes. Describe observable behaviour and required contracts for human
   or software consumers. Include technical details when they define an
   interface, security guarantee, or explicit operational constraint. Keep
   replaceable implementation mechanics in Implementation Decisions or the
   plan. A component name or call restriction belongs in a scenario only when
   changing it would violate the requirement, not merely change the
   implementation. Use Gherkin's optional
   `Rule` to group scenarios that illustrate one business rule when that adds
   clarity. Add a tag only when an established project convention or explicit
   requirement calls for one; choose its value from that context (for example,
   `@billing` for a billing scenario). Omit tags when they add no meaning.
   Use `Background` only for preconditions shared by every scenario; keep
   scenario-specific conditions in their scenario. For example:

   ```gherkin
   Feature: Local assistant mock replies

     Background:
       Given replies are local test output, not AI-generated or live data
       And service and statistics replies use sample information

     Scenario: An ordinary question gets guidance without sign-in
       Given the User is not signed in
       When the User asks an ordinary question in Slack
       Then the reply explains that this local test cannot generate AI answers

     Scenario: A user asks for sample services
       When the User asks for mock services in Slack
       Then the reply shows sample service information
   ```

   Choose the fewest testing seams where a test observes the behaviour, as high
   as they go (a boundary over an internal call), reusing existing ones. Seams
   explain how behaviour can be verified, not what the feature must do. If the
   feature changes behaviour a living spec holds, write the Behavioural Delta
   against it. Include agreed constraints and failure behaviour; keep newly
   identified risks and undecided responses in Open Questions until settled.
   Done when every behaviour in the build request has a scenario and every
   scenario has a seam.

4. **Write the spec** to `spec.md` in the source's project folder, or a new
   `projects/<yyyy-mm-dd>-<slug>/`, filling the template below. Fill the
   header from `date +%F` and `git config user.name`, with Status `Draft`.
   Use the voice-product skill for all authored spec text, including
   acceptance criteria and Gherkin; keep source quotations verbatim. Drop the
   Behavioural Delta section when no existing behaviour changes. Add the spec
   to the project README as
   [PROJECTS-README.md](../shared/PROJECTS-README.md) describes. Done when the
   file is written and you've shared its path.

````markdown
# {Feature} — Specification

- **Status:** Draft
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language, or N/A}

## Development Brief

These are the instructions for building this feature, kept in their original
wording so reviewers can check that the acceptance criteria cover the request.

{Quoted build request and clarifications, or revision-pinned design links.}

## Problem Statement

{What is wrong or missing, for whom.}

## Solution

{What will exist when this is done.}

## User Stories

1. As a {actor}, I want {capability}, so that {benefit}.

## Acceptance Criteria

```gherkin
Feature: {capability}

  Scenario: {one required behaviour}
    Given {a relevant starting state}
    When {an actor takes an action}
    Then {an observable outcome or required guarantee holds}
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
