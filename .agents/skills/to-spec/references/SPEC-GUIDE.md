# Spec writing guide

Read and follow [voice-product](../../voice-product/SKILL.md) and
[CONCISE-PROSE.md](../../shared/CONCISE-PROSE.md) across all explanatory prose
(including Implementation Decisions and `<details>`). Preserve exact
contracts, values, timing, failure codes, and verbatim source quotes.

## Reader clarity and handoff check

Keep `Development Brief`, `Problem Statement`, and `Solution` to 1–3 plain
sentences each, linking `intent.md` instead of repeating request/review
history. Explain unfamiliar domain terms and component roles once on first use
with a brief parenthetical gloss or compact table—never repeat multi-sentence
definitions across sections. Omit defensive process disclaimers ("this draft
does not approve X"); state decision status once in metadata.

Before handoff, verify:

1. A newcomer to the repo can spot the actor, action, permissions, observable
   outcome, and open decisions in one pass, with new component
   responsibilities clearly distinguished from existing ones.
2. Every obligation is stated once (linked elsewhere), and Research is
   separate from Open Questions.
3. IDs, timing, and failure codes are exact, each `Rule` matches its child
   scenarios, and setup stays in `Given`.
4. Check request coverage using
   [PROJECT-INTENT.md](../../shared/PROJECT-INTENT.md)'s handoff check.

## Scenarios, invariants, and scope

Follow [SPEC-FORMAT.md](../../shared/SPEC-FORMAT.md). Fold repetitive variants
into a `Scenario Outline` with `Examples`, and extend existing owning
`docs/specs/<capability>.feature` scenarios rather than duplicating behaviour.

Before drafting Gherkin, check each `Rule` across five lenses:

1. Happy path and actor/permission eligibility.
2. Unauthorized, forbidden, or invalid inputs, plus refusal precedence.
3. Empty, missing, or boundary values.
4. Repeated, duplicate, or expired actions (idempotency and timing).
5. Partial failure, concurrency, or rollback guarantees.

For outbound calls, distinguish upstream error responses, pre-response
connection failures, and timeouts in separate scenarios or outline rows. When
behaviour spans 3+ interacting states, retries/timeouts, or concurrent actors,
run [STATE-MODEL.md](../../shared/STATE-MODEL.md) first so deadlocks and
broken invariants become scenarios.

In Behavioural Delta (omit if unchanged), summarize in 2–3 plain sentences
what the baseline requires, what changes, and what stays unchanged; keep pure
migration chores (moving scenarios, runner updates) in the plan unless they
change required behaviour. Keep setup commands in the plan, not Testing Seams.

Use a compact metadata table (`Status`, `Author`, `Created`, `Language`, plus
optional `Project`, `Baseline`, `Decision status`—never ambiguous `Authority`—
when they orient the reader). Put fixture/runtime languages outside `Language`.

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

{Current request, agreed boundaries, and open choices. Link intent.md when
present, otherwise the preserved source; omit if none.}

## Problem Statement

{What is missing, for whom, and why it matters.}

## Solution

{What will exist when done.}

## User Stories

1. As a {actor}, I want {capability}, so that {benefit}.

## Acceptance Criteria

{Observable scenarios in fenced Gherkin; see SPEC-FORMAT.md.}

## Behavioural Delta

{2–3 sentence plain-language summary plus baseline and grouped scenarios per
SPEC-FORMAT.md; omit if unchanged.}

## Testing Seams

{Short table showing what each check proves and key failure outcomes—avoid
vague "works correctly" phrasing. For runnable apps, require local end-to-end
integration coverage: name entrypoint, real layers/infra, mocked upstreams
grounded in versioned contracts/fixtures (with conformance check and
unverified live-service gaps), and agreed exceptions. Reuse acceptance
scenarios when they cover the path; keep setup commands in the plan.}

| Boundary | What to verify |
| --- | --- |
| {Test boundary} | {Observable result and why it gives meaningful evidence} |

## Implementation Decisions

### {Decision}

{One plain paragraph: user/operator impact, acting component, timing, and
what failure means—understandable without expanding details.}

<details>
<summary>{Descriptive label for supporting technical detail}</summary>

{Supporting detail and rationale in voice-product, preserving exact schemas,
fields, permissions, timing, and error codes. Omit if empty.}

</details>

## Out of Scope

- {Exclusions}

## Living Specifications

- {Owning `docs/specs/<capability>.feature` link and behaviour, or "None — no
  durable behaviour changes"}

## Research

- {[research](./research.md), or "None"}

## Open Questions

- {Unresolved decisions/risks, or "None"}
````
