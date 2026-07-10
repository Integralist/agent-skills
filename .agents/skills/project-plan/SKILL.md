---
name: project-plan
description: >-
  Write an implementation plan to docs/plans/. ALWAYS use this skill
  — never hand-roll a plan by mimicking files in docs/. Use when the
  user wants to create a project/implementation plan, when a plan
  discussed in chat should be persisted, or says /project-plan.
  Guarantees a spec exists, invoking to-spec if absent. Decomposes
  into vertical slices with Blocked-by edges, points to the spec for
  acceptance criteria, and extracts ADRs via to-adr.
---

# Project Plan

Produce a precise, actionable implementation guide: the volatile *how*. The
stable *what* and the definition of done live in the
[`spec`](../to-spec/SKILL.md); this plan links them and turns them into ordered,
demoable work carrying real code — actual signatures, types, and import paths.

Normally invoked by [`architect`](../architect/SKILL.md) after the spec, but it
is the single way to produce a plan document and is often run standalone.

## When to use this skill

Two points are easy to get wrong:

- **A plan just discussed in chat is the source, not a prompt to start over.**
  When the user says "save this" or "turn this into a plan doc", capture *that*
  plan — do not invent a new one or skip the skill.
- Research is an optional input, not a precondition. A spec is required; if
  absent, you must run `to-spec` first to create one.

Never hand-roll a plan by copying the shape of files already in `docs/plans/`.

## Input

Determine what to plan, in priority order:

1. Invoked from `architect` with a build goal, spec, and research → use those.
1. **A plan already worked out in the current conversation** → structure and
   persist *that*; do not start over.
1. Otherwise → ask the user what to build; if the request is vague, elicit
   intent first via [`task`](../task/SKILL.md).

Locate the spec: a path passed in, or the matching file in
`docs/specifications/`. If no spec file exists yet, you must first run
[`to-spec`](../to-spec/SKILL.md) to create one. Read it — its acceptance
criteria and implementation decisions feed the plan.

### Detect programming language

Auto-detect the primary language(s) from file extensions and build files, then
proceed with the detected language unless the user corrects you — fold the
detection into whatever you ask next rather than blocking on a standalone
confirmation:

```txt
Planning in Go (detected). Tell me if the snippets should use a
different language.
```

If the language is Go, load [`go-conventions`](../go-conventions/SKILL.md)
before producing any Go snippets, so embedded code follows the style guide.

### Gather context

Read the spec (above) and all `docs/research/*.md`. These are the foundation for
the plan.

## Acceptance criteria & scaffolding

The **spec** owns the acceptance criteria — the plan links them from its
`## Specification` section, it does not restate them.

- **Code plan** → delegate to [`behaviour-spec`](../behaviour-spec/SKILL.md),
  passing the spec's scenarios and language, for its **scaffold tasks** (add the
  runner dependency, create `features/*.feature`, wire the suite, stub steps).
  Fold these into the slice that first exercises them.
- **Non-code plan** → the spec's prose criteria are verified by checkable
  assertions (grep, command output, file state); no executable scaffolding.
- **No spec** (standalone, or a plan discussed in chat) → you must run
  [`to-spec`](../to-spec/SKILL.md) first to generate a specification doc under
  `docs/specifications/`. This ensures a stable specification file exists.

## Plan document

Write to `docs/plans/<yyyy-mm-dd>-<plan-slug>.md`. Date from `date +%F`, author
from `git config user.name`. A new plan's `Status` is always `Planning`; the
transition to `Complete` and the move to `docs/plans/completed/` happen at
commit time — see [`commit`](../commit/SKILL.md).

````markdown
# {Plan Name}

- **Status**: Planning
- **Author**: {git config user.name}
- **Created**: {date +%F}
- **Language**: {confirmed language, or "Markdown"/"N/A" for non-code}

## Summary

{What is being built and why — one paragraph. Full what/why and
definition of done live in the spec.}

## Specification

Acceptance criteria and scope:
[{spec name}](../specifications/<yyyy-mm-dd>-slug.md).

## Research

- [topic-a](../research/2026-06-17-topic-a.md)

## Prerequisites & Dependencies

{External services, libraries, tools, or config required before
implementation. For a code plan, list the BDD runner here — e.g.
`github.com/cucumber/godog` for Go — so the new dependency is a
conscious choice.}

## Implementation

Vertical slices for multi-layer features; a flat task list for
single-layer or non-code work — see "Slicing the work".

### Slice 1: {what it delivers, end to end}

- **Blocked by**: None — can start immediately
- **Delivers**: {observable, demoable behaviour across every layer
  the slice touches}

- [ ] **Task 1.1**: {specific task}

  {Implementation notes with real code — actual signatures, types,
  import paths. Where it clarifies behaviour, include unit-level
  Given/When/Then prose for the table-driven test.}

  ```{language}
  // Example code showing the approach
  ```

### Slice 2: {what it delivers}

- **Blocked by**: Slice 1 ({why})
- **Delivers**: {…}

- [ ] **Task 2.1**: {specific task}

### Documentation

- [ ] Update `**/README.md` for packages whose public API changed
- [ ] Update `docs/**/*.md` for user-facing behaviour changes

### Verification

- [ ] {How to test end-to-end}
- [ ] All spec acceptance criteria hold — code: via `make test`
  (godog for Go); non-code: via the grep/command/file-state
  assertions named in each scenario

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

## Parallel Execution

> [!IMPORTANT]
> Only delegate a slice to a fire-and-forget subagent if it is
> independent, well-specified, touches files no other slice touches,
> and won't need interactive steering. A sealed subagent can't be
> redirected mid-flight — it ploughs ahead while objections pile up.
> Work you expect to iterate on belongs in the main thread or a
> chat-able teammate. For editing work that still benefits from
> parallel scanning, prefer a two-phase split: a read-only subagent
> returns a proposed-change list, then the main thread applies edits
> with the user able to veto each one.

The Blocked-by graph is the parallelism: slices sharing no
unresolved blocker and touching different files can run concurrently.
Assign each to a subagent role.

| Subagent Role      | Slices              |
| ------------------ | ------------------- |
| {Role description} | {Slice 1, Slice 3}  |

## Notes & Caveats

- {Edge cases, decisions, risks, or open questions.}
````

## Slicing the work

Decompose into **vertical slices**, not horizontal layers. A slice is a tracer
bullet: it cuts a narrow but *complete* path through every layer it touches
(schema, API, UI, tests), is independently demoable, and fits one work session.
Layer-by-layer phases leave nothing runnable until the last phase lands; a slice
gives working behaviour early. Where the spec has acceptance-criteria scenarios,
each scenario is a natural slice boundary.

Every slice declares **Blocked by** — the slices that must finish first, or
"None — can start immediately".

Not everything slices vertically:

- **Single-layer or non-code work** (one package, a doc set, config) has no
  layers to cut — use a flat task list or group by concern, but keep the
  Blocked-by edges.
- **Wide mechanical refactors** (a rename or API change across many call sites)
  use **expand–contract**:
  1. **Expand** — introduce the new form alongside the old; nothing breaks.
  1. **Migrate** — rewrite call sites in batches by blast radius, each batch a
     slice blocked by Expand.
  1. **Contract** — delete the old form once unused; blocked by all migration
     slices.

## Parallel execution

First decide whether parallelism applies at all. A single coherent stream, or an
inherently sequential chain (each slice blocked by the prior), runs in the main
thread — say so in one line and omit the Subagent Role table. Do not fabricate
concurrency to fill the template.

When it does apply:

- **Read the Blocked-by graph.** Slices with no shared unresolved blocker,
  touching different files, run concurrently.
- **Define roles by slice, not by task.** Each role owns a coherent slice of the
  system, not a grab-bag.
- **Keep the team small** — two to four roles; more means more coordination.
- **Make instructions concrete** — the plan goes to an AI agent later, so they
  must be followable mechanically.

The embedded `> [!IMPORTANT]` steerability caveat travels inside the generated
plan so it reaches repos without
[`shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md) — keep
it intact. That file holds the full rule.

## Extract decisions

After the plan is written, delegate to [`to-adr`](../to-adr/SKILL.md), passing
the plan path. Its value gate produces an ADR only for a genuine decision (a
fork with a rejected alternative) and skips mechanical or single-obvious-way
work. If it produces nothing, note in `## Notes & Caveats` why no ADR was
warranted. A PRD, when warranted, is offered separately by `architect` via
[`to-prd`](../to-prd/SKILL.md).

## Surface durable rules

After extracting decisions, delegate to
[`durable-rules`](../durable-rules/SKILL.md). It codifies systemic patterns from
the investigation as conventions or anti-patterns and skips entirely when
nothing durable surfaced. Delegating here reaches both the `architect` flow and
standalone `/project-plan` runs.

## Guidelines

- Use specific file paths and line numbers when referencing code.
- Cite every factual claim inline — `path/to/file.go:42` for code, URL for
  external docs. Label anything you cannot cite an unverified assumption.
- Before finalizing, verify every cited reference resolves: grep/read each
  `path:line` and confirm the symbol still exists. A citation pointing at the
  wrong line is worse than none.
- Each slice small enough to complete in one session.
- Code snippets must be precise — real signatures, types, and import paths. Not
  pseudocode.
- Follow [`markdown-conventions`](../markdown-conventions/SKILL.md) and omit
  needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md). Cut prose, not
  load-bearing detail (paths, constraints, acceptance criteria).

## Agent teams (if your harness supports it)

Execute the Parallel Execution section as a real team: create one teammate per
concurrent slice, give each its slice's tasks, and use the Blocked-by edges to
decide where a teammate must wait for another's output before proceeding. The
team lead coordinates hand-offs and shuts the team down when all slices
complete.

See [`shared/AGENT-TEAMS.md`](../shared/AGENT-TEAMS.md) for enablement
instructions.
