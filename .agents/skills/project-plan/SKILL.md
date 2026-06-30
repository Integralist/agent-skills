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

Produce a precise, actionable implementation guide from research documents and a
description of what to build. The plan carries **executable acceptance criteria**
(Gherkin) so an implementer — human or AI — has a machine-checkable definition of
done.

Normally invoked by [`research-plan`](../research-plan/SKILL.md) after research
completes, but it is the single way to produce a plan document and is most often
run standalone.

## When to use this skill

The frontmatter `description` carries the trigger phrases. Two points are easy
to get wrong:

- **A plan just discussed in chat is the source, not a prompt to start over.**
  When the user says "save this" or "turn this into a plan doc", capture *that*
  plan — do not invent a new one or skip the skill.
- Research is optional input, not a precondition — proceed with or without
  `docs/research/`.

Never hand-roll a plan by copying the shape of files already in `docs/plans/`.

## Input

Determine what to plan, in priority order:

1. If invoked from another skill that passes the build goal and research
   context, use those.
1. **If a plan was already worked out in the current conversation, use that** as
   the source — this skill structures and persists it; it does not start over.
1. Otherwise ask the user what they want to build.

### Detect programming language

Auto-detect the primary language(s) from file extensions and build files, then
proceed with the detected language unless the user corrects you — fold the
detection into whatever you ask next rather than blocking on a standalone
confirmation:

```txt
Planning in Go (detected). Tell me if the snippets should use a
different language.
```

If the language is Go, load the
[`go-conventions`](../go-conventions/SKILL.md) skill before producing any Go
snippets, so all embedded code follows the project's Go style guide.

### Gather context

Read all `docs/research/*.md` files. These are the foundation for the plan.

## Behavioural specs

Always include Given/When/Then acceptance criteria — they clarify intent whether
the plan is code, documentation, or maintenance.

**When the plan describes runnable code** whose behaviour can run as tests:
delegate to [`behaviour-spec`](../behaviour-spec/SKILL.md), passing the feature
description and confirmed language. It returns:

- An **acceptance criteria block** of feature-level Gherkin → goes in the
  `## Acceptance Criteria (BDD)` section.
- A list of **scaffold tasks** (create `.feature` files, add the runner
  dependency, wire the test suite, stub step definitions) → merged into
  `## Implementation Tasks`.

**When the plan is non-code** (documentation, config, skill maintenance,
operational work): author Given/When/Then scenarios as prose acceptance
criteria directly — verified by checkable assertions (grep, command output, file
state) rather than a test runner. Skip the `behaviour-spec` delegation and note
that executable scaffolding was omitted.

## Plan document

Write the guide to `docs/plans/<yyyy-mm-dd>-<plan-slug>.md`. Get the date prefix
from the shell (`date +%F`) — do not guess. Get the author from
`git config user.name`.

A new plan's `Status` is always `Planning`. The transition to `Complete` and the
move to `docs/plans/completed/` happen at commit time — see
[`commit`](../commit/SKILL.md).

Use this template:

````markdown
# {Plan Name}

- **Status**: Planning
- **Author**: {git config user.name}
- **Created**: {date +%F}
- **Language**: {confirmed language, or "Markdown"/"N/A" for non-code}

## Summary

{What needs to be built and why — one paragraph.}

## Acceptance Criteria

Feature-level behaviour the implementation must satisfy. Always
Given/When/Then. Heading and verification differ by plan type:

- **Code plan** — title this `## Acceptance Criteria (BDD)`; scenarios
  come from `behaviour-spec` and become executable (godog for Go).
- **Non-code plan** (docs, config, maintenance) — keep
  `## Acceptance Criteria`; scenarios are verified by checkable
  assertions (grep, command output, file state), not a test runner.
  Note that executable scaffolding was omitted.

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
- [ ] **Task N.2**: All `## Acceptance Criteria` scenarios hold — for a
  code plan, via `make test` (godog for Go); for a non-code plan, via
  the grep/command/file-state assertions named in each scenario

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

## Parallel Execution

This section defines how to split implementation across subagents for
parallel work.

> [!IMPORTANT]
> Only delegate a work stream to a fire-and-forget subagent if it is
> independent, well-specified, touches files no other stream touches,
> and won't need interactive steering. A sealed subagent can't be
> redirected mid-flight — it ploughs ahead while objections pile up.
> Work you expect to iterate on belongs in the main thread or a
> chat-able teammate. For editing work that still benefits from
> parallel scanning, prefer a two-phase split: a read-only subagent
> returns a proposed-change list, then the main thread applies edits
> with the user able to veto each one.

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

> [!NOTE]
> Parallel *coding* subagents suit independent, well-specified
> streams that touch different files with no shared state and a
> clear contract agreed up front. They do **not** suit work you
> expect to steer interactively — a subagent editing code can't
> be redirected mid-flight, so iterative or exploratory work
> belongs in the main thread or a chat-able teammate, not a
> sealed parallel stream. When in doubt, prefer fewer streams.
> See
> [`shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md)
> for the full rule. The generated plan carries a condensed version
> of this rule in its `## Parallel Execution` section so it travels
> to repos that lack the shared file — keep that embedded caveat
> intact.

First decide whether parallelism applies at all. If the work is a single
coherent stream, or is inherently sequential (each task depends on the prior
one), say so in one line and omit the Subagent Roles, Work Streams, and
Synchronization Points tables — do not fabricate streams to fill the template.
Only fill in the section when there are genuinely independent streams.

When filling it in:

1. **Identify independent work streams.** Tasks that touch different files,
   packages, or layers with no shared state can run in parallel.
1. **Define subagent roles by stream, not by task.** Each subagent owns a
   coherent slice of the system, not a grab-bag of unrelated tasks.
1. **Minimize synchronization points.** Prefer designs where streams share a
   contract (interface, schema, API spec) agreed up front so they work
   independently.
1. **Keep the team small.** Two to four subagents is typical; more means more
   coordination overhead.
1. **Make execution instructions concrete.** The plan goes to an AI agent later;
   instructions must be specific enough to follow mechanically.

## Extract formal documents

After the plan is written, decide whether formal documents are warranted:

- **ADR** — invoke when the plan records a genuine architecture decision with a
  real alternative rejected for a stated reason. Skip for mechanical changes,
  single-obvious-way tasks, and maintenance work.
- **PRD** — invoke when the plan has a product/user surface with goals or success
  criteria worth framing independently. Skip for internal refactors, tooling,
  and documentation work.

If either bar is met, delegate to [`extract-doc`](../extract-doc/SKILL.md),
passing the plan path. It writes to `docs/adr/` and `docs/prd/` using the same
`<yyyy-mm-dd>-<slug>` filename convention.

If neither bar is met, note in the plan's `## Notes & Caveats` why formal
documents were skipped, and move on.

## Guidelines

- Use specific file paths and line numbers when referencing code.
- Cite every factual claim inline — `path/to/file.go:42` for code, URL for
  external docs. Claims you cannot cite must be labelled "unverified assumption"
  and include how to verify them.
- Before finalizing, verify every cited reference resolves: grep/read each
  `path:line` and confirm the symbol still exists. Line numbers go stale — a
  citation pointing at the wrong line is worse than none.
- Break work into logical phases (usually by component or layer).
- Each task should be small enough to complete in one session.
- Include a verification phase with concrete test commands.
- Code snippets must be precise — real function signatures, types, and import
  paths. Not pseudocode.
- Keep plans actionable.
- Omit needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md). Cut prose, not
  load-bearing detail (paths, constraints, acceptance criteria).
- Follow [`markdown-conventions`](../markdown-conventions/SKILL.md) for all
  Markdown output.

## Agent teams (if your harness supports it)

Execute the Parallel Execution section as a real team: create one teammate per
work stream, give each its stream's tasks, and use the Synchronization Points
table to decide where a teammate must wait for another's output before
proceeding. The team lead coordinates hand-offs and shuts the team down when all
tasks complete.

See [`shared/AGENT-TEAMS.md`](../shared/AGENT-TEAMS.md) for enablement
instructions.
