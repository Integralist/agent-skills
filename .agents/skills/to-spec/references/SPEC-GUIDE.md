# Spec writing guide

Before drafting or revising, read and apply
[voice-product](../../voice-product/SKILL.md) to all explanatory prose,
including Implementation Decisions and expanded detail. Preserve exact
contracts and verbatim source quotations.

## Reader path and clarity check

Keep `spec.md` decision-first and compact. Follow
[CONCISE-PROSE.md](../../shared/CONCISE-PROSE.md): open `Development Brief`,
`Problem Statement`, and `Solution` in 1–3 sentences each, and link `intent.md`
instead of embedding request or review history.

Explain necessary technical terms or component roles once with a short
parenthetical gloss (a few words) or a compact table—never multi-sentence
explanations repeated across sections. Omit defensive process disclaimers
("this draft does not approve X"); state decision status once in metadata.

Before handoff, check the draft:

1. Can a fresh reader spot the actor, action, permissions, outcome, and open
   decisions in one pass? Distinguish new component responsibilities from
   existing ones in one line.
2. Is every obligation stated once (linked elsewhere) and Research separated
   from Open Questions?
3. Are externally referenced IDs, timing, and failure codes exact, with each
   `Rule` matching its child scenarios and setup in `Given`?
4. Check request coverage using
   [PROJECT-INTENT.md](../../shared/PROJECT-INTENT.md)'s handoff check.

## Scenarios and scope

Follow [SPEC-FORMAT.md](../../shared/SPEC-FORMAT.md). Fold repetitive variants
into a `Scenario Outline` with `Examples` instead of copying near-identical
scenarios, and link owning `.feature` files once created.

Acceptance Criteria states observable behaviour; Testing Seams names the test
boundary in a short `Boundary | What to verify` bullet or table without
repeating setup commands. Living Specifications assigns each durable scenario to
an owning `docs/specs/<capability>.feature` file.

For changed living behaviour, follow the Behavioural Delta format below. Open
with a plain-language summary that tells product and engineering readers what
the baseline requires, what the proposal changes, and what remains unchanged.
Keep migration chores—such as moving scenarios, editing feature descriptions,
or updating test runners—in the plan unless they affect required behaviour.
Retain exact scenario snapshots and technical terms when needed to preserve
the contract.

### Rule-first invariant pass

Before drafting Gherkin, list each `Rule` and check five lenses so
invariants and existing contracts are settled upfront:

1. Happy path and actor or permission eligibility.
2. Unauthorized, forbidden, or invalid cases, plus refusal precedence.
3. Empty, missing, or boundary inputs.
4. Repeated, duplicate, or expired actions (idempotency and timing).
5. Partial failure, concurrency, or rollback guarantees.

When behaviour spans 3+ interacting states, retries/timeouts, or concurrent
actors, run [STATE-MODEL.md](../../shared/STATE-MODEL.md) before drafting
Gherkin so deadlocks and broken invariants become scenarios.

Check owning `docs/specs/*.feature` files first; extend or modify an
existing scenario or `Scenario Outline` rather than adding overlapping
scenarios.

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

{Current request, agreed boundaries and open choices. Link intent.md when
present, otherwise the preserved source; omit a link if no source is available.}

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

Use a small table to tell readers what each check proves, not just where it
runs. Choose clear column labels such as **Boundary** and **What to verify**.
For each boundary, state the observable result the check confirms and why it
gives meaningful evidence. Name important failure conditions and expected
outcomes; avoid vague phrases such as “works correctly” or “fallback absent.”
Keep setup instructions and test commands in the implementation plan.

| Boundary | What to verify |
| --- | --- |
| {Test boundary} | {Observable result and why it provides meaningful evidence} |

## Implementation Decisions

### {Decision}

{One clear paragraph in voice-product: what changes for the user or operator,
which component acts, when, and what a failed check means. Explain necessary
terms; make the decision understandable without opening the supporting detail.}

<details>
<summary>{Descriptive label for the technical detail}</summary>

{Explain supporting technical detail and rationale in voice-product too.
Preserve exact fields, permissions, timing, failure codes and schemas; clearer
wording cannot change the contract. Omit the dropdown when it adds no value.}

</details>

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
