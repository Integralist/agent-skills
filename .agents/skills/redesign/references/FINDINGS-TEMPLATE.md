# Redesign Findings Template

Write to `projects/<yyyy-mm-dd>-redesign-<slug>/redesign.md` (creating the
directory first). Because `to-plan` plans from this file, cite real
`file:line` paths, function signatures, types, and import paths rather than
pseudocode. Omit Purpose Drift for feature scope.

````markdown
# Redesign: {feature, subsystem, or codebase}

- **Author**: {git config user.name}
- **Created**: {date +%F}
- **Language**: {detected language}
- **Scope**: feature | subsystem | codebase — {name or path}
- **Plan**: [plan.md](./plan.md)

## Summary

{One paragraph: root problem and high-level reimplementation strategy.}

## Current State

{Key files, data/control flow, and core problems; add a Mermaid diagram via
[`conventions-mermaid`](../../conventions-mermaid/SKILL.md) if helpful.}

## Findings

### Structure
{Ranked findings with `file:line`, impact, and concrete remedy; end with the
key insight.}

### Standards and Precedent Drift
{Rule violations (file + rule) and unwritten drift (>= 2 peer citations).}

### Purpose Drift
{Omit for feature scope. Quoted doc lines vs. code reality.}

### Test Coverage
{Boundary coverage map focused on seams the redesign touches.}

## Cross-Cutting Wins
{Restructurings that fix multiple axes; these lead.}

## Strategy
{Target decomposition, prerequisite build order, keep vs. rewrite/delete, and
each target marked pinned or `BLOCKED-ON-TESTS: needs {missing tests}`.}

## Behavioral Invariants
{Behaviours the redesign must preserve (from purpose docs and tests).}

## What We Should Have Done First
{Missing prerequisites: interfaces, shared types, test fakes, decisions.}

## Approval Bar

Treat these as presumptive blockers unless explicitly justified:
- A dramatic simplification or code-judo deletion is left on the table.
- Feature logic remains scattered across shared modules.
- Shallow wrappers, duplicate helpers, or escape-hatch contracts survive.

## Notes
- {Risks, open questions, and every `BLOCKED-ON-TESTS` target.}
````
