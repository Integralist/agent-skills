---
name: refactor
description: >-
  Analyze an existing feature and produce a reimplementation
  plan focused on reducing complexity and fragmentation. Asks:
  "If we started over, what would we do differently?"
disable-model-invocation: true
argument-hint: <feature or area to refactor>
---

# Refactor

Strategic refactoring skill. Investigates a feature in the
current codebase, identifies complexity and fragmentation, and
produces a reimplementation plan answering: "Knowing what we
know now, if we started from scratch, how would we do this
differently?"

## Input

The argument follows the skill invocation. If empty, prompt:

```txt
What feature or area do you want to refactor?
```

Parse the response into a short kebab-case slug (e.g.,
`auth-middleware`, `config-loading`) for use in file names.

## Gather project metadata

Load [`git-metadata/SKILL.md`](../git-metadata/SKILL.md) and
run its commands. Include the output in the subagent prompt as
context so it can prioritize empirically.

## Investigation Phase

Spawn a single subagent (exploration / investigation role). The
subagent prompt must include:

- The feature or area to investigate
- The current working directory
- The **project metadata** gathered above — instruct the
  subagent to use this metadata to prioritize which code to
  investigate first and to corroborate its findings against the
  empirical data
- The investigation checklist below (include verbatim)
- The **code-judo brief** from
  [`../_shared/CODE-JUDO.md`](../_shared/CODE-JUDO.md) (include
  verbatim) — push the subagent toward deletions, not just
  rearrangements, scoped to this single feature
- Instructions to use file reading, search, and any relevant
  language tools available

### Investigation checklist

Include this verbatim in the subagent prompt:

> You are a principal engineer performing a strategic code
> review. Your goal is to deeply understand a feature's
> implementation and answer: "If we were to reimplement this
> from scratch, what would we do differently?"
>
> **Map the implementation:**
>
> - Identify all files, functions, types, and interfaces
>   involved
> - Trace the data flow and control flow end-to-end
> - Document the public API surface and internal boundaries
> - Note which packages/modules own which responsibilities
>
> **Identify complexity hotspots:**
>
> - Functions longer than 50 lines that do multiple things
> - Deep nesting (>3 levels)
> - High cyclomatic complexity
> - Complex conditionals or switch statements
> - Functions with many parameters (>4)
>
> **Identify fragmentation:**
>
> - Logic for the same concern scattered across multiple
>   packages
> - Duplicated patterns that should be unified
> - Inconsistent abstractions (same concept modeled differently
>   in different places)
> - Leaky abstractions where internals bleed across boundaries
> - Orphaned helpers or utilities that belong closer to their
>   callers
>
> **Identify coupling issues:**
>
> - Circular or upward dependencies between packages
> - Concrete types used where interfaces would decouple
> - Shared mutable state or global variables
> - Tight coupling to external services without abstraction
>
> **Identify missing prerequisites:**
>
> - What interfaces, shared types, or abstractions should have
>   existed before this feature was built?
> - What test infrastructure (helpers, fixtures, fakes) is
>   missing?
> - What documentation or architectural decisions should have
>   been made first?
>
> **Structure your report as:**
>
> 1. **Implementation map** — files, types, and data flow
> 1. **Complexity hotspots** — ranked by severity
> 1. **Fragmentation issues** — ranked by impact
> 1. **Coupling issues** — ranked by risk
> 1. **Missing prerequisites** — what should have existed first
> 1. **Key insight** — the single biggest deletion opportunity: the
>    one change that makes the most complexity vanish

## Analysis

Synthesize the investigation findings into a coherent
reimplementation strategy. Focus on:

- What the root causes of complexity are (not just symptoms)
- What the ideal decomposition looks like
- What order things should be built in (prerequisites first)
- What can be preserved vs. what needs rewriting

## Plan Output

Emit the plan using the shared skeleton in
[`../_shared/REIMPL-PLAN-TEMPLATE.md`](../_shared/REIMPL-PLAN-TEMPLATE.md).
Substitute:

- `{Plan Type}` → `Refactor`
- `{Scope Name}` → the feature name
- `{plan-type}` → `refactor`
- `{slug}` → the feature slug

`refactor` adds no extra sections — leave every insertion-point
anchor empty. The shared file also carries the output path and
the plan-writing guidelines.

## Surface durable rules

Load [`durable-rules/SKILL.md`](../durable-rules/SKILL.md) and
follow its process.

## Agent teams (if your harness supports it)

Run the investigation agent as a teammate in parallel rather than
inline, then build the plan from its report.

See [`_shared/AGENT-TEAMS.md`](../_shared/AGENT-TEAMS.md) for
enablement instructions.
