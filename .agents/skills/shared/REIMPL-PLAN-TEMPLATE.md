# Reimplementation Plan — Shared Template

Both `refactor` and `redesign` emit a phased reimplementation plan with the
same skeleton. This file is the single source of truth for that skeleton.

The caller substitutes:

- `{Plan Type}` — `Refactor` or `Redesign`.
- `{Scope Name}` — the feature, subsystem, or `codebase` being planned.
- `{plan-type}` — lowercase slug for the filename (`refactor` / `redesign`).
- `{slug}` — kebab-case slug of the scope.

Create the output directory with `mkdir -p docs/plans`, then write the plan
to `docs/plans/<yyyy-mm-dd>-{plan-type}-{slug}.md` (date prefix from today's
date).

A caller may **insert** its own sections at the anchors marked
`<!-- insertion point: ... -->`. A caller with no extra sections simply omits
those anchors.

````markdown
# {Plan Type}: {Scope Name}

- **Status**: Planning
- **Author**: {author from git config}
- **Created**: {YYYY-MM-DD}
- **Language**: {detected language}

<!-- insertion point: extra metadata bullets -->

## Summary

{One paragraph: what is wrong with the current implementation and the
high-level reimplementation strategy.}

## Current State

{Brief description of the current implementation — key files, data flow, and
where the problems are. Include a Mermaid diagram if the system is complex.}

<!-- insertion point: findings / analysis sections -->

## What We Should Have Done First

{Prerequisites that should have existed before this code was built —
interfaces, shared types, test infrastructure, architectural decisions.}

## Reimplementation Tasks

<!-- insertion point: pre-prerequisite phases (e.g. Phase 0 test pinning) -->

### Phase 1: Prerequisites

- [ ] **Task 1.1**: {Prerequisite work}

  {Detailed notes with code snippets:}

  ```{language}
  // Example code showing the approach
  ```

### Phase 2: {Core Reimplementation}

- [ ] **Task 2.1**: {Specific task}

### Phase N-1: Documentation

- [ ] **Task (N-1).1**: Update `**/README.md` files for packages whose
  public API changed.
- [ ] **Task (N-1).2**: Update `docs/**/*.md` for user-facing behavior
  changes.

### Phase N: Verification

- [ ] **Task N.1**: {How to verify behavior is preserved}
- [ ] **Task N.2**: {How to verify complexity is reduced}

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

<!-- insertion point: trailing sections (e.g. Approval Bar) -->

## Notes & Caveats

- {Edge cases, risks, or open questions.}
````

Print a short summary and the file path in the conversation.

## Shared guidelines

- Use specific file paths and line numbers when referencing code.
- Code snippets must use real function signatures, real types, real import
  paths. Not pseudocode.
- Break the work into logical phases (prerequisites first, then core work,
  then verification).
- Each task should be small enough to complete in one session.
- The plan describes a reimplementation, not incremental patches. The goal is
  "what would we do if starting over," not "what's the minimal diff."
- Include a verification phase with concrete test commands.
- Wrap all Markdown output at 80 columns.
