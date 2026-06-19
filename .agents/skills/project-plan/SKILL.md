---
name: project-plan
description: >-
  Write a project plan / implementation plan document to docs/plans/.
  ALWAYS use this skill — do not hand-roll a plan by mimicking files
  in docs/. Triggers on: "create a project plan", "write a plan doc",
  "create a new project plan doc", "save this as a plan so we can
  revisit it", "turn this into a plan", "document this plan", or
  /project-plan. Applies whether or not research exists, and even when
  a plan was just discussed in chat. Detects the language, embeds
  Gherkin acceptance criteria via behaviour-spec, defines parallel
  work streams, and extracts a formal ADR/PRD.
---

# Project Plan

Produce a precise, actionable implementation guide from research
documents and a description of what to build. The plan carries
**executable acceptance criteria** (Gherkin) so an implementer — human
or AI — has a machine-checkable definition of done.

This skill is normally invoked by [`research-plan`](../research-plan/SKILL.md)
after research completes, but it is the single way to produce a plan
document and is most often run standalone.

## When to use this skill

Invoke this skill whenever a plan document needs writing — never
hand-roll one by copying the shape of files already in `docs/plans/`.
In particular:

- The user asks to "create a project plan", "write a plan doc",
  "create a new project plan doc", "document this plan", or similar.
- **A plan was just discussed or presented in chat** and the user wants
  it saved (e.g. "save this so we can revisit it", "turn this into a
  plan doc"). This is the common case: the plan already exists in the
  conversation — capture *that* plan, do not invent a new one or skip
  the skill.
- Research exists or not — research is optional input, not a
  precondition.

## Input

Determine what to plan, in priority order:

1. If invoked from another skill that passes the build goal and
   research context, use those.
1. **If a plan was already worked out in the current conversation, use
   that** as the source — this skill structures and persists it; it does
   not start over.
1. Otherwise ask the user what they want to build.

### Detect programming language

Auto-detect the project's primary language(s) by examining file
extensions and build files. Present the detected language to the user
for confirmation:

```txt
Detected language: Go. Is that correct, or should I use a different
language for the code snippets?
```

If the confirmed language is Go, load the
[`go-conventions`](../go-conventions/SKILL.md) skill before producing any
Go code snippets in the plan, so all embedded code follows the project's
Go style guide.

### Gather context

Read all `docs/research/*.md` files for context. These are the
foundation for the plan.

## Behavioural specs

Delegate to the [`behaviour-spec`](../behaviour-spec/SKILL.md) skill,
passing the feature description and the confirmed language. Run that
skill to completion.

It returns two things, which you fold into the plan below:

- An **acceptance criteria block** of feature-level Gherkin → goes in
  the `## Acceptance Criteria (BDD)` section.
- A list of **scaffold tasks** (create `.feature` files, add the runner
  dependency, wire the test suite, stub step definitions) → merged into
  the `## Implementation Tasks`.

## Plan document

Write a detailed implementation guide to
`docs/plans/<yyyy-mm-dd>-<plan-slug>.md` (date prefix from today's
date).

Use this template:

````markdown
# {Plan Name}

- **Status**: Planning
- **Author**: {author from git config}
- **Created**: {YYYY-MM-DD}
- **Language**: {confirmed language}

## Summary

{What needs to be built and why — one paragraph.}

## Acceptance Criteria (BDD)

Feature-level behaviour the implementation must satisfy, from
`behaviour-spec`. These become executable scenarios (godog for Go).

```gherkin
Feature: {capability}

  Scenario: {one concrete behaviour}
    Given {a starting state}
    When {an action occurs}
    Then {an observable outcome holds}
```

## Research

This plan draws from the following research documents:

- [topic-a](../research/2026-06-17-topic-a.md)
- [topic-b](../research/2026-06-17-topic-b.md)

## Prerequisites & Dependencies

{External services, libraries, tools, or configuration required before
implementation begins. If using feature-level Gherkin, list the BDD
runner here — e.g. `github.com/cucumber/godog` for Go — so the new
dependency is a conscious choice.}

## Implementation Tasks

### Phase 1: {Phase Name}

- [ ] **Task 1.1**: {Specific task description}

  {Detailed implementation notes with code snippets. Where it clarifies
  behaviour, include unit-level Given/When/Then prose for the
  table-driven test:}

  ```{language}
  // Example code showing the approach
  ```

- [ ] **Task 1.2**: {Specific task description}

### Phase 2: {Phase Name}

- [ ] **Task 2.1**: {Specific task description}

### Phase N-1: Documentation

- [ ] **Task (N-1).1**: Update `**/README.md` files for packages whose
  public API changed
- [ ] **Task (N-1).2**: Update `docs/**/*.md` for user-facing behavior
  changes

### Phase N: Verification

- [ ] **Task N.1**: {How to test end-to-end}
- [ ] **Task N.2**: All `## Acceptance Criteria (BDD)` scenarios pass
  via `make test` (godog for Go)

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

## Parallel Execution

This section defines how to split implementation across subagents for
parallel work.

### Subagent Roles

| Subagent Role             | Responsibility                    |
| ------------------------- | --------------------------------- |
| {Role description}        | {What this subagent owns}         |
| {Role description}        | {What this subagent owns}         |

### Work Streams

Group tasks into independent work streams that can run in parallel.
Each stream is assigned to a subagent role.

**Stream 1 — {Stream Name}** ({role description})

- Task {X.Y}
- Task {X.Z}

**Stream 2 — {Stream Name}** ({role description})

- Task {X.Y}
- Task {X.Z}

### Synchronization Points

List points where streams must wait for each other before proceeding.
Reference specific task IDs.

| Sync Point           | Blocked Stream | Waiting On     |
| -------------------- | -------------- | -------------- |
| {e.g., API contract} | {stream 2}     | {stream 1}     |

## Notes & Caveats

- {Edge cases, decisions, risks, or open questions.}
````

### Parallel execution section

When filling in the Parallel Execution section:

1. **Identify independent work streams.** Look for tasks that touch
   different files, packages, or layers with no shared state. These can
   run in parallel.
1. **Define subagent roles by stream, not by task.** Each subagent
   should own a coherent slice of the system, not a grab-bag of
   unrelated tasks.
1. **Minimize synchronization points.** Prefer designs where streams
   share a contract (interface, schema, API spec) agreed up front so
   they can work independently.
1. **Keep the team small.** Two to four subagents is typical. More
   subagents means more coordination overhead.
1. **Make execution instructions concrete.** The plan will be handed to
   an AI agent later. The instructions must be specific enough to follow
   mechanically.

## Extract formal documents

Immediately after the plan is written, delegate to the
[`extract-doc`](../extract-doc/SKILL.md) skill, passing the path to the
plan just created. It auto-detects whether the plan warrants an ADR, a
PRD, or both, and writes them to `docs/adr/` and `docs/prd/` using the
same `<yyyy-mm-dd>-<slug>` filename convention as the plan.

Run that skill to completion, then notify the user that the plan and
its formal documents (ADR/PRD) are done.

## Guidelines

- Use specific file paths and line numbers when referencing code.
- Every factual claim in the plan must be cited inline —
  `path/to/file.go:42` for code, URL for external docs. Claims you
  cannot cite must be labelled "unverified assumption" and include how
  to verify them.
- Break work into logical phases (usually by component or layer).
- Each task should be small enough to complete in one session.
- Include a verification phase with concrete test commands.
- Code snippets should be precise — real function signatures, real
  types, real import paths. Not pseudocode.
- Plans should be actionable.
- Wrap all Markdown output at 80 columns.

## Agent teams (if your harness supports it)

If your harness supports named, parallel agent teams (e.g. Claude
Code's experimental [agent teams](https://code.claude.com/docs/en/agent-teams)),
execute the Parallel Execution section as a real team: create one
teammate per work stream, give each its stream's tasks, and use the
Synchronization Points table to decide where a teammate must wait for
another's output before proceeding. The team lead coordinates hand-offs
and shuts the team down when all tasks complete.

On Claude Code, enable agent teams by adding the following to
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
