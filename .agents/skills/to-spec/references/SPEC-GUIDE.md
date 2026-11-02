# Spec writing guide

Read this before drafting acceptance criteria or the project spec.

## Scenarios and scope

Describe observable behaviour and required contracts for human or software
consumers. Include technical details when they define an interface, security
guarantee, or explicit operational constraint. Keep replaceable implementation
mechanics in Implementation Decisions or the plan. A component name or call
restriction belongs in a scenario only when changing it would violate the
requirement, not merely change the implementation.

Use Gherkin's optional `Rule` to group scenarios that illustrate one business
rule when it adds clarity. Add tags only for an established project convention
or explicit requirement, choosing values from that context (for example,
`@billing`). Omit tags when they add no meaning. Use `Background` only for
preconditions shared by every scenario; keep scenario-specific conditions in
the scenario.

Example:

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

In `spec.md`'s `## Living Specifications` section, list each owning
`docs/specs/<capability>.feature` file and the behaviour it covers. Acceptance
runners load those `.feature` files directly; do not keep duplicate scenarios
in test-local files. In `## Acceptance Criteria`, state observable behaviour:
what users see or systems do. In `## Testing Seams`, name the highest reusable
boundary tests should use to observe that behaviour (prefer a boundary over
an internal call).

If the feature changes behaviour held in a living spec, write a
[`## Behavioural Delta`](../../shared/SPEC-FORMAT.md#behavioural-delta) section
in `spec.md`. Include agreed constraints and failure behaviour. Keep newly
identified risks and undecided responses in Open Questions until settled.

## Spec template

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

- {[`docs/specs/<capability>.feature`](...) — the behaviour it owns. Use inline
  code for a file that implementation will create, or
  "None — no durable behaviour changes"}

## Research

- {[research](./research.md), or "None"}

## Open Questions

- {Unresolved decisions or risks}
````
