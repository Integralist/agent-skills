# Redesign Findings Template

Write the findings to `projects/<yyyy-mm-dd>-redesign-<slug>/redesign.md`,
with today's date, creating the directory first. This is the source the
to-plan skill plans from, so cite specific file paths and line numbers, and
use real function signatures, types, and import paths rather than
pseudocode. For a feature scope, leave out Purpose Drift. Wrap Markdown at
80 columns.

````markdown
# Redesign: {feature, subsystem, or codebase}

- **Author**: {git config user.name}
- **Created**: {date +%F}
- **Language**: {detected language}
- **Scope**: feature | subsystem | codebase — {name or path}
- **Plan**: [plan.md](./plan.md)

## Summary

{One paragraph: what is wrong with the current implementation and the
high-level reimplementation strategy.}

## Current State

{The current implementation: key files, data flow, and where the problems
are, with a Mermaid diagram if the system is complex (see
[`conventions-mermaid`](../conventions-mermaid/SKILL.md)).}

## Findings

### Structure

{Subagent 1's findings by severity. Each: file:line, trigger, impact,
concrete remedy. End with the key insight.}

### Standards and Precedent Drift

{Subagent 2's findings. Each cites the standard (file and rule), or at
least two peers that set the pattern.}

### Purpose Drift

{Subagent 3's findings. Each quotes the doc line.}

### Test Coverage

{Subagent 4's coverage map, focused on boundaries the redesign touches.}

## Cross-Cutting Wins

{Findings that resolve several axes; these go first.}

## Strategy

{The ideal decomposition, the build order with prerequisites first, and what
to keep versus rewrite. Mark each restructure target as pinned by existing
tests or `BLOCKED-ON-TESTS: needs {specific missing tests}`.}

## Behavioral Invariants

{The behaviours the redesign must preserve, from purpose docs and existing
tests. This is the post-redesign verification target.}

## What We Should Have Done First

{Prerequisites that should have existed before this code was built:
interfaces, shared types, test infrastructure, architectural decisions.}

## Approval Bar

The implementation treats the following as presumptive blockers — if any
survive, justify them explicitly:

- A code-judo move that would delete incidental complexity is left on
  the table.
- A file >1000 lines is preserved or made larger without strong reason.
- Feature logic remains scattered across shared modules.
- Unnecessary abstractions, wrappers, or escape-hatch-typed contracts
  remain.
- A near-duplicate of an existing canonical helper is kept.

## Notes

- {Risks, open questions, and every BLOCKED-ON-TESTS target.}
````
