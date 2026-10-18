---
name: code-module-review
description: >-
  Explain and review how a scoped piece of code is structured. Use when the
  user asks how a feature or package is put together; whether a PR or existing
  code has clean module boundaries; where new logic should live or which
  module should own it; or how the code could be reshaped.
metadata:
  model-tier: complex
---

# Code Module Review

Map how a scoped piece of code works, then judge whether its modules and seams
sit in the right places, with every claim backed by source. Review only: change
code only when the user asks. Use the vocabulary and principles in
[code-module-design](../code-module-design/SKILL.md), the project's domain terms
from `GLOSSARY.md`, and [conventions-mermaid](../conventions-mermaid/SKILL.md)
for every diagram.

1. **Scope.** Resolve the target from the user's file, diff, PR, feature, or
   package, and ask which code to map if none is clear. For a PR or diff,
   follow callers, dependencies, and neighbouring modules only as far as
   ownership needs; this isn't a codebase-wide scan. Read nearby package docs,
   `GLOSSARY.md`, and ADRs. If only `CONTEXT.md` exists, use it and note it's
   the legacy glossary. Done when you can name the code you're tracing and its
   neighbours.
2. **Map the current state.** Read source, imports, call sites, and peers
   before drawing, and keep static dependencies apart from runtime calls: an
   import doesn't prove a call. Draw each view that adds something the others
   don't:
   - **Placement:** the target and the neighbouring modules that own related
     responsibilities, with static dependencies and plausible existing homes
     for the logic.
   - **Interaction:** the runtime participants and the control or data flow
     between them, as a sequence diagram for ordered exchanges or a flowchart
     when branching or ownership reads better.
   - **Call path:** one entry point through the functions that implement the
     behaviour, with transformations, side effects, and error paths, using
     real names and source locations.

   Keep each view small enough to read, splitting rather than shrinking, and
   say in a line why a view is skipped. Cite `path:line` in the text beside
   each diagram, not in its labels. Done when every view is validated, or
   marked unvalidated if `mmdc` isn't available.
3. **Assess ownership and seams.** Against the source, check:
   - which existing module already owns this concept, found by
     responsibility, callers, types, and imports rather than by name;
   - whether callers coordinate several shallow modules that one deeper
     module could own behind a smaller interface;
   - whether logic sits with the concept it changes or leaks into a caller,
     shared utility, or unrelated package;
   - whether dependencies cross the seam in the right direction, and whether
     a proposed seam has a second adapter to justify it;
   - whether moving the logic would gain locality or leverage without pushing
     complexity onto callers.

   A finding names its demonstrated cost: duplicated responsibility, leaked
   implementation, caller coordination, coupling, or something as specific. A
   layout that differs from a preferred pattern isn't a cost. For a claim
   that rests on project precedent, use the precedent skill and cite at least
   two peers. Done when each finding has evidence and a cost, or you've
   concluded the placement is sound or the evidence inconclusive.
4. **Report** in this shape, labelling inferences and proposals as such:

   ```md
   **Scope and summary:** what was traced, and the short answer.

   **Current state:** each view, with a short explanation and `path:line`
   citations.

   **Boundary findings,** ranked by impact: the current responsibility,
   evidence, cost, and the smallest coherent alternative. If there are none,
   say the boundaries look sound.

   **Target view,** only for a finding that warrants a structural change: the
   proposed ownership or interaction, at the same level as its current view.

   **Unknowns and next step:** facts that could change the assessment, and
   one focused follow-up.
   ```

   Done when the report is delivered.

**Handing off.** For a broad scan for deepening opportunities, use
[improve-codebase-architecture](../improve-codebase-architecture/SKILL.md). For
a scoped reimplementation plan, use [redesign](../redesign/SKILL.md). To explore
alternative interfaces for a chosen module, follow
[DESIGN-IT-TWICE.md](../code-module-design/DESIGN-IT-TWICE.md).
