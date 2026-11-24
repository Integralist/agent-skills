# Plan structure and slice rules

Read and follow [voice-product](../../voice-product/SKILL.md) and
[CONCISE-PROSE.md](../../shared/CONCISE-PROSE.md) across all explanatory prose
(Summary, slice outcomes, Notes, and `<details>`), preserving exact
signatures, identifiers, and contract values.

Keep the top of each section decision-first and scannable (deliverable,
blockers, gates, and milestones first); collapse multi-line signature blocks,
acceptance-verification tables, and dense rationale inside `<details>`.

- **Link shared context once:** Never copy `Prerequisites`, `Pull Request
  Delivery`, `Local Running and Integration Tests`, repo rules, or shared
  interfaces into individual slices or GitHub Slice Sub-Issues—link the shared
  `plan.md` section.
- **Newcomer clarity:** Spell out lettered IDs or shorthand before first use
  (`Slice 1 (S1)`, `Milestone 1.1 (M1.1)`), or include a compact key once at
  the top. Explain unfamiliar terms on first use.

## Slice design

Cut vertical slices: each traces through every layer it touches, is demoable
on its own, and fits in one session. Use one flat `#### Milestones` list for
single-layer or non-code work, and expand–contract (add new, migrate callers,
remove old) for wide renames.

For every slice:

- State `Blocked by` and `Consumes`/`Produces` with exact signatures (inside
  `<details>` when multi-line).
- Key verifiable outcome milestones `M<slice>.<n>` (what is true when done,
  not files touched), linked to spec criteria when present; never renumber
  assigned keys.
- Include an acceptance-verification contract: criterion or milestone, owning
  living feature and scenario names (including outline rows), testing
  boundary, and verification command. Include living `.feature` updates and
  missing steps/runner in the slice that implements the behaviour, reading and
  following
  [conventions-acceptance-tests](../../conventions-acceptance-tests/SKILL.md).
  If no feature applies, explain why and name equivalent executable
  assertions (a missing feature or harness is planned work, not an
  exemption). For runnable apps, build/extend the minimum local harness in the
  first slice that needs it rather than deferring integration to the end.
- Pick an outcome diagram via
  [OUTCOME-DIAGRAMS.md](../../shared/OUTCOME-DIAGRAMS.md) when it helps
  reviewers, run [STATE-MODEL.md](../../shared/STATE-MODEL.md) if a slice adds
  3+ interacting states/retries/concurrency without a prior spec check, and
  choose PR shape via
  [PULL-REQUEST-DELIVERY.md](../../shared/PULL-REQUEST-DELIVERY.md) (naming
  slices/milestones, not task numbers).

The plan is complete when every requirement maps to a milestone and acceptance
check, and shared names match. Planning records how acceptance will be proved;
execution supplies passing evidence.

## Local running and integration tests

For runnable applications, define one shared section matching the spec's
Testing Seams (or settle the same decisions if no spec exists), reusing
existing project tooling—or record why a local runtime does not apply:

- Run the real application wiring, real storage/cache engines, and production
  outbound clients against local protocol mocks (never mock the behaviour
  under test or fall back to live endpoints; keep any live-service checks
  explicit and separate).
- Name mock contracts/fixtures, conformance checks, configurable endpoints,
  synthetic credentials, and lifecycle commands (start, bounded readiness,
  migrations/seed, reset, test, teardown including failure cleanup), isolating
  test state from developer data. Reuse the repo's native or container runtime
  (Docker or Apple Container, not both by default). Record mock-backed
  evidence as such, not live-service proof.

## Plan template

````markdown
# {Feature} — Plan

- **Status:** Planning
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language, or N/A}
- **Spec:** {[spec](./spec.md), or "None — criteria live in the milestones"}

## Summary

{2–3 reader-facing sentences: problem, what changes for whom, why it matters.}

{Optional shared outcome diagram with captioned slice/milestone IDs.}

## Prerequisites

{Services, libraries, tools, or config needed first, or "None".}

## Local Running and Integration Tests

{Shared runtime, dependencies/mocks, contract checks, lifecycle and test
commands; link existing setup, or state why not applicable.}

## Pull Request Delivery

{Mode and layer table, per PULL-REQUEST-DELIVERY.md.}

## Implementation

### Slice 1: {what it delivers end to end}

#### Problem

{1–2 plain sentences introducing the system/context and what is missing or
broken, explaining unfamiliar terms on first use.}

- **Gate / needs decision:** {approval or blocker, or omit}
- **Blocked by:** None

#### Solution

{1–2 plain sentences on what changes and what stays untouched.}

{Optional focused outcome diagram for Slice 1.}

#### Slice 1 Milestones

- [ ] **M1.1**: {checkable outcome} {— [criterion](./spec.md#anchor)}

<details>
<summary>Contracts and acceptance verification</summary>

- **Consumes:** None
- **Produces:** {exact signatures later slices rely on}

```{language}
{key signatures}
```

#### Acceptance Verification

| Criterion | Feature scenarios / assertions | Boundary | Command |
| --- | --- | --- | --- |
| {M1.1 + criterion} | {feature + names + rows} | {boundary} | `{command}` |

</details>

### Slice 2: {what it delivers end to end}

#### Problem / Solution

{1–2 sentences each; state Blocked by: Slice 1 ({why}) and optional diagram.}

#### Slice 2 Milestones

- [ ] **M2.1**: {checkable outcome} {— [criterion](./spec.md#anchor)}

<details>
<summary>Contracts and acceptance verification</summary>

- **Consumes:** {signatures from Slice 1}
- **Produces:** {exact signatures, or None}

#### Acceptance Verification

| Criterion | Feature scenarios / assertions | Boundary | Command |
| --- | --- | --- | --- |
| {M2.1 + criterion} | {feature + names + rows} | {boundary} | `{command}` |

</details>

### Documentation

- [ ] {Living spec `docs/specs/<capability>.feature` to seed or update}
- [ ] {README or `docs/` page whose behaviour or usage changes}

## File Changes

| File | Change |
| --- | --- |
| `{path}` | {what and why} |

## Notes

{Design trade-offs, deferred work, intent-review record, and ADR status.}
````
