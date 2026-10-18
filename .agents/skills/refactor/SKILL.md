---
name: refactor
description: >-
  Investigate an existing feature and write a reimplementation plan that cuts
  its complexity and fragmentation. Use when asked how a feature would be
  built differently if started over, or for a refactoring plan for one area.
disable-model-invocation: true
argument-hint: <feature or area to refactor>
metadata:
  model-tier: complex
---

# Refactor

Investigate one feature and write a plan answering: "Knowing what we know
now, if we started from scratch, how would we build this differently?" Aim
for deletions, not just rearrangements.

1. **Name the feature.** Take it from the argument, or ask "What feature or
   area do you want to refactor?" Turn it into a short kebab-case slug, such
   as `auth-middleware`. Done when you have the feature and slug.
2. **Gather project metadata** by running the commands in
   [git-metadata](../git-metadata/SKILL.md). Done when you have its output.
3. **Spawn one investigation subagent** on the cheapest adequate model,
   following [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md),
   including its completion and retry protocol; run it as a background
   teammate if your harness supports agent teams (see
   [AGENT-TEAMS.md](../shared/AGENT-TEAMS.md)). Give it the feature, the
   working directory, the metadata to prioritise and corroborate against,
   the investigation brief below verbatim, and the code-judo brief verbatim
   from [CODE-JUDO.md](../shared/CODE-JUDO.md), scoped to this feature. Done
   when it returns all seven report sections.
4. **Synthesise a reimplementation strategy** from the report: the root
   causes of complexity rather than symptoms, the ideal decomposition, the
   build order with prerequisites first, and what to keep versus rewrite.
   Done when the strategy covers all four.
5. **Write the plan** with
   [REIMPL-PLAN-TEMPLATE.md](../shared/REIMPL-PLAN-TEMPLATE.md), which holds
   the output path and writing rules. Substitute `Refactor` for
   `{Plan Type}`, the feature name for `{Scope Name}`, `refactor` for
   `{plan-type}`, and the slug for `{slug}`; refactor adds no sections, so
   leave out the insertion-point anchors. Done when the plan is written.
6. **Surface durable rules** by following
   [durable-rules](../durable-rules/SKILL.md). Done when it's run.

**Investigation brief.**

````md
You are a principal engineer doing a strategic code review. Understand this
feature's implementation deeply and answer: "If we reimplemented this from
scratch, what would we do differently?" Use file reading, search, and any
language tools available.

- **Map the implementation:** every file, function, type, and interface
  involved; the data and control flow end to end; the public API and
  internal boundaries; which packages own which responsibilities.
- **Complexity hotspots:** functions over 50 lines doing several things,
  nesting over 3 levels, high cyclomatic complexity, complex conditionals or
  switches, more than 4 parameters.
- **Fragmentation:** one concern scattered across packages; duplicated
  patterns to unify; one concept modelled differently in different places,
  citing the peer `file:line` that sets each pattern you say is departed
  from; leaky abstractions; helpers that belong nearer their callers.
- **Shallow module sprawl:** modules with large interfaces over thin logic,
  such as pass-through wrappers; callers coordinating several low-level
  helpers instead of one deep entry point; callers importing intermediate
  types or state the module should keep private; webs of thin files that
  could collapse into one deep module behind a small API.
- **Coupling:** circular or upward dependencies; concrete types where an
  interface would decouple; shared mutable state or globals; tight coupling
  to external services.
- **Missing prerequisites:** interfaces, shared types, or abstractions that
  should have existed first; missing test helpers, fixtures, or fakes;
  documentation or decisions that should have come first.

Report, in order:

1. **Implementation map:** files, types, and data flow.
2. **Complexity hotspots,** ranked by severity.
3. **Fragmentation issues,** ranked by impact.
4. **Shallow module sprawl:** chances to consolidate into deep modules.
5. **Coupling issues,** ranked by risk.
6. **Missing prerequisites.**
7. **Key insight:** the single biggest deletion, the one change that makes
   the most complexity vanish.
````
