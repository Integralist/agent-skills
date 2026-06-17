---
name: research-plan
description: >-
  Two-phase workflow: research topics deeply, then create
  implementation plans. Bootstraps AGENTS.md, produces
  docs/research/ reference docs, and docs/plans/
  implementation guides. Also handles repo-by-name research.
  Use when the user wants to research a topic, explore a
  repo, create a project plan, or says /research-plan.
---

# Research & Plan

Two-phase skill: **research** first, then **plan**. Research
produces deep reference documents; plans consume those documents
to produce precise implementation guides.

## Phase 0: Bootstrap project instructions

Before anything else, delegate to the [`agents-md`](../agents-md/SKILL.md)
skill. It reconciles `AGENTS.md`, `CLAUDE.md`, and
`GEMINI.md` so `AGENTS.md` is canonical and the other two
are thin `@AGENTS.md` pointers — bootstrapping any that
are missing.

Run that skill to completion, then prompt the user:

```txt
What do you want researched?
```

## Phase 1: Research

Delegate to the [`research`](../research/SKILL.md) skill. It
detects whether the input is a repo or a topic, gathers
project metadata for repos, spawns a subagent (for code
research) or runs the research inline (for topic research),
and writes findings to `docs/research/<slug>.md`.

Run that skill to completion before continuing.

### After research completes

Notify the user that research is done, then present two options:

1. **Research another topic** — ask what to research next and
   loop back to Phase 1.
1. **Create a plan** — proceed to Phase 2.

## Phase 2: Plan

Ask the user what they want to build.

### Detect programming language

Auto-detect the project's primary language(s) by examining file
extensions and build files. Present the detected language to the
user for confirmation:

```txt
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
subagents for parallel work.

### Subagent Roles

| Subagent Role             | Responsibility                    |
| ------------------------- | --------------------------------- |
| {Role description}        | {What this subagent owns}         |
| {Role description}        | {What this subagent owns}         |

### Work Streams

Group tasks into independent work streams that can run
in parallel. Each stream is assigned to a subagent role.

**Stream 1 — {Stream Name}** ({role description})

- Task {X.Y}
- Task {X.Z}

**Stream 2 — {Stream Name}** ({role description})

- Task {X.Y}
- Task {X.Z}

### Synchronization Points

List points where streams must wait for each other
before proceeding. Reference specific task IDs.

| Sync Point           | Blocked Stream | Waiting On     |
| -------------------- | -------------- | -------------- |
| {e.g., API contract} | {stream 2}     | {stream 1}     |

## Notes & Caveats

- {Edge cases, decisions, risks, or open questions.}
````

### Parallel execution section

When filling in the Parallel Execution section:

1. **Identify independent work streams.** Look for tasks that
   touch different files, packages, or layers with no shared
   state. These can run in parallel.
1. **Define subagent roles by stream, not by task.** Each
   subagent should own a coherent slice of the system, not a
   grab-bag of unrelated tasks.
1. **Minimize synchronization points.** Prefer designs where
   streams share a contract (interface, schema, API spec)
   agreed up front so they can work independently.
1. **Keep the team small.** Two to four subagents is typical.
   More subagents means more coordination overhead.
1. **Make execution instructions concrete.** The plan will be
   handed to an AI agent later. The instructions must be
   specific enough to follow mechanically.

## Phase 3: Extract formal documents

Immediately after the plan is written, delegate to the
[`extract-doc`](../extract-doc/SKILL.md) skill, passing the path to
the plan just created. It auto-detects whether the plan warrants an
ADR, a PRD, or both, and writes them to `docs/adr/` and `docs/prd/`
using the same `<yyyy-mm-dd>-<slug>` filename convention as the
plan.

Run that skill to completion.

### After plan completes

Notify the user that the plan and its formal documents (ADR/PRD)
are done, then present two options:

1. **Research another topic** — loop back to Phase 1.
1. **Create another plan** — loop back to the Phase 2 prompt.

## Guidelines

- Use specific file paths and line numbers when referencing
  code.
- Every factual claim in a research document must be cited
  inline — `path/to/file.go:42` for code, URL for external
  docs. Claims you cannot cite must be labelled "unverified
  assumption" and include how to verify them.
- Break work into logical phases (usually by component or
  layer).
- Each task should be small enough to complete in one session.
- Include a verification phase with concrete test commands.
- Code snippets should be precise — real function signatures,
  real types, real import paths. Not pseudocode.
- Research documents should be exhaustive. Plans should be
  actionable.
- Wrap all Markdown output at 80 columns.

## Agent teams (if your harness supports it)

If your harness supports named, parallel agent teams (e.g. Claude
Code's experimental [agent teams](https://code.claude.com/docs/en/agent-teams)),
execute the Parallel Execution section as a real team: create one
teammate per work stream, give each its stream's tasks, and use the
Synchronization Points table to decide where a teammate must wait
for another's output before proceeding. The team lead coordinates
hand-offs and shuts the team down when all tasks complete.

On Claude Code, enable agent teams by adding the following to
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
