---
name: code-module-review
description: >-
  Explain and review the structure of a scoped piece of code. Use whenever the
  user asks how a feature is structured, whether a PR or existing code has clean
  module or package boundaries, where logic should live, which existing module
  should own it, or how the code could be reshaped. Produce focused Mermaid
  views of ownership, interactions, and the relevant call path; recommend a
  target shape only when code evidence supports it.
---

# Code Module Review

Explain how a scoped piece of code works, then assess whether its modules and
seams are well placed. Stay review-only unless the user explicitly asks for
changes. Treat diagrams as evidence-backed maps, not decoration.

## Scope

1. Resolve the target from the user's file, diff, PR, feature, or package. If no
   target is clear, ask which code to map.
2. For a PR or diff, inspect the changed code and follow relevant callers,
   dependencies, and neighboring modules far enough to assess ownership. Keep
   the review scoped to that path; do not scan the whole codebase for unrelated
   opportunities.
3. Read relevant package documentation, the project `GLOSSARY.md`, and nearby
   ADRs when present. If only `CONTEXT.md` exists, use it and report that it is
   the legacy glossary.
4. Separate observed behavior from inference. Mark missing context as an
   unknown instead of filling it with a plausible story.

## Build the current-state map

Read [`../code-module-design/SKILL.md`](../code-module-design/SKILL.md) for the
architecture vocabulary and principles. Read
[`../conventions-mermaid/SKILL.md`](../conventions-mermaid/SKILL.md) before
writing or validating diagrams. Use
[`../show-me/SKILL.md`](../show-me/SKILL.md) as a reference for choosing a
compact visual form.

Inspect the source, imports, call sites, and nearby peers before drawing. Keep
static dependencies separate from runtime calls: an import graph does not prove
that one module calls another at runtime. Cite source paths and line numbers in
the text around each diagram; keep diagram labels readable.

Produce these three views when each adds distinct information:

1. **Placement:** show the target package or modules and the neighboring
   modules that own related responsibilities. Show static dependencies and
   identify plausible existing homes for the target logic.
2. **Interaction:** show the runtime participants and the important control or
   data flow between them. Use a sequence diagram for ordered exchanges, or a
   flowchart when branching or ownership is clearer.
3. **Call path:** trace one relevant entry point through the functions that
   implement the behavior, including important transformations, side effects,
   and error paths. Use real function names and source locations.

Keep each view focused. Split or simplify a diagram rather than shrinking a
large codebase map into unreadable detail. If a view would repeat another, or
the code has no distinct level to show, explain that briefly instead of padding
it. Validate every Mermaid diagram with `mmdc` before presenting it. If the CLI
is unavailable, say the diagrams are unvalidated.

## Assess ownership and seams

Use the code-module-design terms **module**, **interface**, **implementation**,
**depth**, **seam**, **adapter**, **leverage**, and **locality** where they fit.
Use the project's domain terms for the concepts the code represents.

Check the following against source evidence:

- Which existing module owns the same concept or responsibility, if any?
- Do callers coordinate several shallow modules when one deeper module could
  own the workflow behind a smaller interface?
- Does logic sit with the concept it changes, or leak into a caller, shared
  utility, or unrelated package?
- Do dependencies cross the likely seam in the right direction? Is a proposed
  seam real, or would it add indirection without a second justified adapter?
- Would moving the logic improve locality or leverage without spreading
  complexity to callers?

Search for candidate homes by responsibility, callers, types, imports, and
package documentation—not just by matching names. When a claim relies on
project precedent, load [`../precedent/SKILL.md`](../precedent/SKILL.md), compare
peers, and cite at least two examples. Do not treat a single nearby example as
a convention.

Do not label code poorly designed because its file layout differs from a
preferred pattern. Name the demonstrated cost: duplicated responsibility,
leaked implementation detail, caller coordination, coupling, or another
specific consequence. If no concrete cost is supported, report that the current
placement appears reasonable or that the evidence is inconclusive.

## Present the result

Use this order:

1. **Scope and summary** — identify what was traced and give the short answer.
2. **Current-state views** — include the three Mermaid views above, with a
   short explanation and source citations next to each.
3. **Boundary assessment** — list only evidence-backed findings, ranked by
   impact. For each, state the current responsibility, evidence, design cost,
   and the smallest coherent alternative.
4. **Target view** — when a finding warrants a structural change, show a
   Mermaid view of the proposed ownership or interaction. Keep it at the same
   level as the finding's current-state view and make the change visible. Do
   not draw a speculative target when the current design is sound.
5. **Unknowns and next step** — call out unresolved facts that could change the
   assessment. Suggest a focused follow-up, not an automatic refactor.

Use source citations such as `internal/orders/handler.go:42`. Label inferred
relationships and proposed designs as such. If the assessment finds no
boundary problem, say so plainly; do not invent one to justify the skill.

## Hand off when the task changes

- For a broad codebase scan for deepening opportunities, hand off to
  [`../improve-codebase-architecture/SKILL.md`](../improve-codebase-architecture/SKILL.md).
- For a scoped reimplementation plan, hand off to
  [`../refactor/SKILL.md`](../refactor/SKILL.md).
- For parallel alternatives to a chosen interface, use
  [`../code-module-design/DESIGN-IT-TWICE.md`](../code-module-design/DESIGN-IT-TWICE.md).
