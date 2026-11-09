---
name: code-module-review
description: >-
  Explain and review how a scoped piece of code is structured. Use when the
  user asks how a feature or package is put together; whether a PR or existing
  code has clean module boundaries; where new logic should live or which
  module should own it; or how the code could be reshaped.
metadata:
  model-tier: moderate
---

Map a scoped piece of code, then assess whether its modules and seams belong
where they are. Back every claim with source evidence. This is review-only:
change code only when the user asks.

Use the vocabulary and principles in
[code-module-design](../code-module-design/SKILL.md), the project's domain
terms from `GLOSSARY.md`, and
[conventions-mermaid](../conventions-mermaid/SKILL.md) for every diagram.

## 1. Scope

Resolve the target from the user's file, diff, PR, feature, or package. If
none is clear, ask which code to map. For a PR or diff, follow callers,
dependencies, and neighbouring modules only as far as needed to establish
ownership; do not scan the whole codebase. Read nearby package docs,
`GLOSSARY.md`, and ADRs. If only `CONTEXT.md` exists, use it and note it is
the legacy glossary. Continue when you can name the code being traced and its
neighbours.

## 2. Map the current state

Read source, imports, call sites, and peers before drawing. Keep static
dependencies separate from runtime calls: an import alone does not prove a
call.

Draw only views that add information beyond the others:

- **Placement:** the target and neighbouring modules that own related
  responsibilities, showing static dependencies and plausible existing homes
  for the logic.
- **Interaction:** runtime participants and control or data flow. Use a
  sequence diagram for ordered exchanges, or a flowchart when branching or
  ownership reads better.
- **Call path:** one entry point through the functions implementing the
  behaviour, including transformations, side effects, and error paths. Use
  real names and source locations.

Keep each view readable; split diagrams rather than shrinking them. For every
skipped view, say why. Cite `path:line` in nearby text, not diagram labels.
Validate each view, or mark it unvalidated if `mmdc` is unavailable.

## 3. Assess ownership and seams

Use source evidence to check:

- Which existing module owns the concept, based on responsibility, callers,
  types, and imports—not its name alone.
- Whether callers coordinate several shallow modules that one deeper module
  could own behind a smaller interface.
- Whether logic sits with the concept it changes or leaks into a caller,
  shared utility, or unrelated package.
- Whether a likely change to a format, policy, or default requires edits in
  several modules, or callers must know an implementation detail.
- Whether callers handle an ordinary case or configuration choice that the
  owning module could handle once.
- Whether dependencies cross the seam in the right direction, and whether a
  proposed seam has a second adapter to justify it.
- Whether moving logic would improve locality or leverage without pushing
  complexity onto callers.
- Whether the module's tests reach it through its interface, or pin internal
  helpers. Pinned helpers suggest the seam is in the wrong place.

A finding must name its demonstrated cost: duplicated responsibility, leaked
implementation, caller coordination, coupling, or another specific cost. A
layout that differs from a preferred pattern is not a cost. If a claim relies
on project precedent, use the precedent skill and cite at least two peers.
Finish with evidence for every finding, or conclude that placement is sound or
the evidence is inconclusive.

## 4. Report

Label inferences and proposals as such. Include:

- **Scope and summary:** what was traced and the short answer.
- **Current state:** each view, with a short explanation and `path:line`
  citations.
- **Boundary findings, ranked by impact:** current responsibility, evidence,
  cost, and the smallest coherent alternative. If there are none, say the
  boundaries look sound.
- **Target view:** only for findings that warrant structural change; show the
  proposed ownership or interaction at the same level as the current view.
- **Unknowns and next step:** facts that could change the assessment and one
  focused follow-up.

Finish when the report is delivered.

## Hand off when appropriate

- For a broad scan for deepening opportunities, use
  [improve-codebase-architecture](../improve-codebase-architecture/SKILL.md).
- For a scoped reimplementation plan, use
  [redesign](../redesign/SKILL.md).
- To explore alternative interfaces for a chosen module, follow
  [DESIGN-IT-TWICE.md](../code-module-design/references/DESIGN-IT-TWICE.md).
