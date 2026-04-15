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

### Check for existing research

Before starting new research, scan `docs/research/` for
documents that already cover the topic or a closely related
one. Match broadly — a request about "CI pipeline caching"
is covered by an existing `ci.md` or
`continuous-integration.md`.

- **Exact or near match found**: Read the document. If it
  already covers what the user needs, skip to the "After
  research completes" prompt. If it covers the topic
  partially, extend it — add new sections or deepen
  existing ones rather than creating a second file.
- **No match found**: Proceed with new research below.

### Conduct research

Take the user's topic and study it deeply. Use every tool at
your disposal: read source code, explore the codebase, fetch
documentation via MCP, search the web, and check sibling
repositories in the parent directory (`../`) for relevant
reference implementations or prior art.

### Output

Write to `docs/research/<topic-slug>.md` (new file) or
extend the existing document identified above.

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

### Phase N-1: Documentation

- [ ] **Task (N-1).1**: Update `**/README.md` files for
  packages whose public API changed
- [ ] **Task (N-1).2**: Update `docs/**/*.md` for user-facing
  behavior changes

### Phase N: Verification

- [ ] **Task N.1**: {How to test end-to-end}

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

## Parallel Execution

This section defines how to split implementation across
an agent team for parallel work. The team lead coordinates
and owns integration; teammates own independent work
streams.

### Team Definition

- **Team name**: `{kebab-case-project-name}`
- **Team lead**: Coordinates tasks, resolves blockers,
  integrates results.

| Teammate    | Role / Responsibility             |
| ----------- | --------------------------------- |
| `{name-a}`  | {What this agent owns}            |
| `{name-b}`  | {What this agent owns}            |

### Work Streams

Group tasks into independent work streams that can run
in parallel. Each stream is assigned to a teammate.

**Stream 1 — {Stream Name}** (`{teammate-name}`)

- Task {X.Y}
- Task {X.Z}

**Stream 2 — {Stream Name}** (`{teammate-name}`)

- Task {X.Y}
- Task {X.Z}

### Synchronization Points

List points where streams must wait for each other
before proceeding. Reference specific task IDs.

| Sync Point           | Blocked Stream | Waiting On            |
| -------------------- | -------------- | --------------------- |
| {e.g., API contract} | `{name-b}`     | `{name-a}` Task {X.Y} |

### Execution Instructions

To execute this plan with agent teams:

1. Create the team: `TeamCreate("{team-name}")`
2. Create all tasks from the Implementation Tasks section
   using `TaskCreate`, setting `blockedBy` where the
   Synchronization Points table indicates dependencies.
3. Spawn teammates using the Agent tool with `team_name`
   and `name` matching the Team Definition table.
4. Assign each teammate their work stream tasks via
   `TaskUpdate` with `owner`.
5. Teammates mark tasks completed via `TaskUpdate` and
   pull their next unblocked task from `TaskList`.
6. At synchronization points, the blocked teammate waits
   for a `SendMessage` from the teammate it depends on
   confirming the blocking task is done.
7. When all tasks are complete, the team lead sends
   `{type: "shutdown_request"}` to each teammate.

## Notes & Caveats

- {Edge cases, decisions, risks, or open questions.}
````

### Parallel execution section

When filling in the Parallel Execution section of the
plan template:

1. **Identify independent work streams.** Look for tasks
   that touch different files, packages, or layers with
   no shared state. These can run in parallel.
1. **Define teammates by stream, not by task.** Each
   teammate should own a coherent slice of the system
   (e.g., "API layer", "database migrations", "CLI
   commands"), not a grab-bag of unrelated tasks.
1. **Minimize synchronization points.** Prefer designs
   where streams share a contract (interface, schema,
   API spec) agreed up front so they can work
   independently. Only add sync points where one stream
   genuinely cannot proceed without another's output.
1. **Keep the team small.** Two to four teammates is
   typical. More teammates means more coordination
   overhead. Only add a teammate when the work is
   substantial enough to justify it.
1. **Make execution instructions concrete.** The plan
   will be handed to an AI agent later. The Execution
   Instructions must be specific enough that the agent
   can follow them mechanically — real team names, real
   task references, real dependency relationships.

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
