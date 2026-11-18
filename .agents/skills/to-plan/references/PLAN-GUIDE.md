# Plan structure and slice rules

Before drafting or revising prose, read and apply
[voice-product](../../voice-product/SKILL.md) throughout the plan, including
Notes and expanded detail, not only the Summary and slice outcomes. Preserve
exact signatures, identifiers and contract values.

Use this guide while designing slices, milestones, acceptance checks, diagrams,
and the plan document. Keep the top of each section scannable and short: follow
[CONCISE-PROSE.md](../../shared/CONCISE-PROSE.md) budgets and put the
deliverable, blockers, gates, and milestones first. Collapse dense signature
blocks, acceptance-verification tables, and supporting rationale inside
`<details>` so they do not bury what needs review.

**Link shared context once.** Never copy `Prerequisites`, `Pull Request
Delivery`, `Local Running and Integration Tests`, repo rules, or shared
interfaces into individual slices or GitHub
Slice Sub-Issues; link the shared `plan.md` section instead.

**Define lettered IDs before use.** Spell out a lettered prefix or shorthand on
first use (`Slice 1 (S1)`, `Milestone 1.1 (M1.1)`), or keep a compact 3–5 row
key once at the top instead of repeating definitions.

## Slice design

Cut vertical slices: each should trace through every layer it touches, be
demoable on its own, and fit in one session. For single-layer or non-code
work, use one flat `#### Milestones` list. For a wide rename, use expand–
contract: add the new form, migrate call sites in slices, then remove the old
form.

For every slice:

- State `Blocked by` and `Consumes`/`Produces` with exact signatures (placed
  in `<details>` when multi-line). Implementers read their own slice plus the
  linked shared contracts in `plan.md`.
- Give milestones verifiable outcomes, keyed `M<slice>.<n>`. Describe what is
  true when done, not which files change. Link each milestone to its spec
  criterion when there is a spec. Without one, make the milestone wording
  checkable. Never renumber assigned keys; task lists and execution logs use
  them.
- Include an acceptance-verification contract: criterion or milestone,
  owning living feature and scenario names (including outline rows), testing
  boundary, and verification command. Include each living `.feature` update
  and missing steps or runner in the slice that implements its behaviour.
  Follow the acceptance-test conventions in the
  [skill](../../conventions-acceptance-tests/SKILL.md).
  If no feature applies, explain why and name equivalent executable
  assertions. A missing required feature or harness is planned work, not an
  exemption. For application behaviour, name the real entrypoint, layers,
  infrastructure, and mocked upstreams exercised. Build or extend the minimum
  local harness in the first slice that needs it; later slices extend its
  coverage rather than deferring integration to a final slice.
- Choose an outcome diagram (individual, shared, mixed, or none) using
  [OUTCOME-DIAGRAMS.md](../../shared/OUTCOME-DIAGRAMS.md), based on what helps
  the reviewer understand the change.
- When a slice introduces 3+ interacting states, retries/timeouts, or
  concurrency without a prior spec check, run
  [STATE-MODEL.md](../../shared/STATE-MODEL.md).
- Choose the delivery shape using
  [PULL-REQUEST-DELIVERY.md](../../shared/PULL-REQUEST-DELIVERY.md). Name
  slices or milestones, not task numbers.

The plan is complete when every requirement maps to a milestone and acceptance
check, and every shared name is consistent. Planning records how acceptance
will be proved; execution supplies passing evidence.

## Local running and integration tests

For runnable applications, define one shared local-running section, reusing
existing project tooling. Follow the spec's Testing Seams; without a spec,
settle the same decisions before handoff. Record agreed exceptions or why a
local application runtime does not apply.

- Exercise the running application with production wiring, relevant real
  storage/cache engines, and production outbound clients calling local
  protocol mocks. Do not mock the application behaviour being verified.
- Name mock contracts/fixtures and their conformance checks, configurable
  endpoints, and synthetic identities/credentials. After dependency bootstrap,
  the local path needs no live upstreams or credentials; never fall back to
  live endpoints. Keep any required live-service checks explicit and separate.
- Specify startup, bounded readiness checks, migrations/seeding, reset, test,
  and teardown commands, including cleanup after failure. Share wiring between
  manual development and automated tests, but isolate test state and cleanup
  from developer data.
- Reuse the project's native or container runtime; choose Docker or Apple
  Container where appropriate, not both by default. Keep full observability
  optional unless required to prove the agreed behaviour.

Acceptance scenarios can run through this path; add focused integration checks
only for gaps. Record mock-backed evidence as such, not as live-service proof.

## Plan template

````markdown
# {Feature} — Plan

- **Status:** Planning
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language, or N/A}
- **Spec:** {[spec](./spec.md), or "None — criteria live in the milestones"}

## Summary

{Two or three reader-facing sentences: the problem, what changes for whom,
and why it matters.}

{Optional shared outcome diagram: caption the covered slice or milestone IDs,
then a fenced Mermaid block. Omit when better covered within Implementation.}

## Prerequisites

{Services, libraries, tools, or config needed first, or "None".}

## Local Running and Integration Tests

{Shared runtime, dependencies/mocks, contract checks, lifecycle and test
commands per this guide; link existing setup. Or state why not applicable.}

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

{Optional focused outcome diagram for Slice 1, captioned with its ID. Omit
when covered by a shared diagram or clearer without one.}

#### Slice 1 Milestones

- [ ] **M1.1**: {checkable outcome}
  {— [criterion](./spec.md#anchor), when there's a spec}

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

- **Delivers:** {observable behaviour}

{Optional focused outcome diagram for Slice 2, captioned with its ID. Omit
when covered by a shared diagram or clearer without one.}

- **Blocked by:** Slice 1 ({why})
- **Consumes:** {signatures from Slice 1}
- **Produces:** {exact signatures, or None}

#### Slice 2 Milestones

- [ ] **M2.1**: {checkable outcome}
  {— [criterion](./spec.md#anchor), when there's a spec}

#### Acceptance Verification

| Criterion | Feature scenarios / assertions | Boundary | Command |
| --- | --- | --- | --- |
| {M2.1 + criterion} | {feature + names + rows} | {boundary} | `{command}` |

### Documentation

- [ ] {Living spec `docs/specs/<capability>.feature` to seed or update}
- [ ] {README or `docs/` page whose behaviour or usage changes}

## File Changes

| File | Change |
| --- | --- |
| `{path}` | {what and why} |

## Notes

- **Coverage check:** {review result, remaining gaps, and any limitations}
- {Risks, open questions, unverified assumptions.}
````
