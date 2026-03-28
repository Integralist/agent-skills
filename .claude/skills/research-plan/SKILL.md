---
name: research-plan
description: >-
  Two-phase workflow: research topics deeply, then create
  implementation plans. Bootstraps CLAUDE.md, produces
  docs/research/ reference docs, and docs/plans/ implementation
  guides. Use when the user wants to research a topic, create
  a project plan, or says /research-plan.
---

# Research & Plan

Two-phase skill: **research** first, then **plan**. Research
produces deep reference documents; plans consume those documents
to produce precise implementation guides.

## Phase 0: Bootstrap CLAUDE.md

Before anything else, check the project root for a `CLAUDE.md`.

### If CLAUDE.md does not exist

Analyze the project and create an orientation-focused `CLAUDE.md`.
Focus on three things:

1. **WHY** — What is this project and what problem does it solve?
1. **WHAT** — Repo structure, language boundaries, key entry
   points.
1. **HOW** — Commands to build/test/lint, plus gotchas that
   cannot be discovered from code alone.

Point to docs; don't repeat them. Everything else (architecture,
API surfaces, coding style) is discoverable via tools, MCPs,
skills, and reading the code.

### If CLAUDE.md already exists

Review it. If it is stale or missing any of the three sections
above, update it. Otherwise, leave it alone.

### Then prompt

Ask the user:

```text
What do you want researched?
```

## Phase 1: Research

Take the user's topic and study it deeply. Use every tool at
your disposal: read source code, explore the codebase, fetch
documentation via MCP, search the web, and check sibling
repositories in the parent directory (`../`) for relevant
reference implementations or prior art.

### Output

Write a detailed document to `docs/research/<topic-slug>.md`.

Use this template:

```markdown
# {Topic}

## Overview

{What this is and why it matters — one or two paragraphs.}

## Key Concepts

{Core abstractions, terminology, and mental models.}

## Architecture / How It Works

{Internal structure, data flow, component relationships.
Use Mermaid diagrams for complex systems.}

## API Surface / Interface

{Public API, configuration options, CLI flags — whatever
the consumer interacts with.}

## Gotchas & Edge Cases

{Surprising behavior, common mistakes, undocumented
limitations.}

## Trade-offs

{Design decisions and their consequences. What was chosen
and what was given up.}

## References

{Links to source files, external docs, RFCs, issues.}
```

### After research completes

Notify the user that research is done, then present two options:

1. **Research another topic** — ask what to research next and
   loop back to Phase 1.
1. **Create a plan** — proceed to Phase 2.

## Phase 2: Plan

Ask the user what they want to build.

### Detect programming language

Auto-detect the project's primary language(s) by examining file
extensions, build files (`go.mod`, `package.json`, `Cargo.toml`,
`pyproject.toml`, etc.), and project structure. Present the
detected language to the user for confirmation:

```text
Detected language: Go. Is that correct, or should I use
a different language for the code snippets?
```

### Gather context

Read all `docs/research/*.md` files for context. These are the
foundation for the plan.

### Plan document

Write a detailed implementation guide to
`docs/plans/<plan-slug>.md`.

Use this template:

````markdown
# {Plan Name}

- **Status**: Planning
- **Author**: {author from git config}
- **Created**: {YYYY-MM-DD}
- **Language**: {confirmed language}

## Summary

{What needs to be built and why — one paragraph.}

## Research

This plan draws from the following research documents:

- [topic-a](../research/topic-a.md)
- [topic-b](../research/topic-b.md)

## Prerequisites & Dependencies

{External services, libraries, tools, or configuration
required before implementation begins.}

## Implementation Tasks

### Phase 1: {Phase Name}

- [ ] **Task 1.1**: {Specific task description}

  {Detailed implementation notes with code snippets:}

  ```{language}
  // Example code showing the approach
  ```

- [ ] **Task 1.2**: {Specific task description}

### Phase 2: {Phase Name}

- [ ] **Task 2.1**: {Specific task description}

### Phase N: Verification

- [ ] **Task N.1**: {How to test end-to-end}

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

## Notes & Caveats

- {Edge cases, decisions, risks, or open questions.}
````

### After plan completes

Notify the user that the plan is done, then present two options:

1. **Research another topic** — loop back to Phase 1.
1. **Create another plan** — loop back to the Phase 2 prompt.

## Guidelines

- Use specific file paths and line numbers when referencing code.
- Break work into logical phases (usually by component or layer).
- Each task should be small enough to complete in one session.
- Include a verification phase with concrete test commands.
- Code snippets should be precise — real function signatures,
  real types, real import paths. Not pseudocode.
- Research documents should be exhaustive. Plans should be
  actionable.
- Wrap all Markdown output at 80 columns.
