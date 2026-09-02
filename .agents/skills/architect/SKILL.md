---
name: architect
description: >-
  Design and plan a feature from idea to actionable artifacts. Use when
  architecting a feature, exploring a design before planning, or coordinating
  research, spec, and plan phases.
---

# Architect

Design-and-plan coordinator: turn an idea into the artifacts that support
building it. Four phases — **bootstrap → research → spec → plan** — each
delegated to its own skill. This file only sequences them; the depth lives in
the delegates.

## Phase 0: Bootstrap project instructions

Delegate to [`agents-md`](../agents-md/SKILL.md), which reconciles `AGENTS.md`,
`CLAUDE.md`, and `GEMINI.md` so `AGENTS.md` is canonical and the others are thin
`@AGENTS.md` pointers, bootstrapping any that are missing. Run it to completion,
then prompt:

```txt
What do you want to build? I'll research it first.
```

If the answer is vague, delegate to [`clarify`](../clarify/SKILL.md) to elicit intent
(audience, goal, context, constraints, format) before researching.

## Phase 1: Research

Delegate to [`research`](../research/SKILL.md). It detects whether the input is
a repo or a topic, gathers project metadata for repos, and writes findings to
`docs/research/<yyyy-mm-dd>-<slug>.md` (or `projects/<yyyy-mm-dd>-<slug>/research.md`
when scoped to an active project). Run it to completion, then present:

1. **Research another topic** — ask what next and loop back to Phase 1.
1. **Write a spec** — proceed to Phase 2.

## Phase 2: Spec

Delegate to [`to-spec`](../to-spec/SKILL.md), passing the build goal, the
project slug, and the Phase 1 research context. It writes the problem, solution,
user stories, acceptance criteria (via
[`behaviour-spec`](../behaviour-spec/SKILL.md)), testing seams, and scope to
`projects/<yyyy-mm-dd>-<slug>/spec.md`. Run it to completion, then present:

1. **Grill and stress-test the design** — delegate to
   [`grill-with-docs`](../grill-with-docs/SKILL.md) to interview the user, pin
   down domain terms, and record ADRs before planning.
1. **Refine the spec or research more** — loop back to Phase 1 or 2.
1. **Create a plan** — proceed to Phase 3.

## Phase 3: Plan

Delegate to [`project-plan`](../project-plan/SKILL.md), passing the build goal,
the project directory, the spec, and the research context. It writes the plan to
`projects/<yyyy-mm-dd>-<slug>/plan.md`, decomposes the work into vertical slices
with interface contracts (`Consumes` / `Produces`) and Blocked-by edges, points
to `./spec.md` for acceptance criteria, and extracts ADRs via
[`to-adr`](../to-adr/SKILL.md) into `projects/<yyyy-mm-dd>-<slug>/adr-<title>.md`.
Run it to completion.

## Offer a PRD

After the plan, offer [`to-prd`](../to-prd/SKILL.md) as an opt-in step — a
focused product framing (goals, success metrics, audience) sourced from the
spec, written to `projects/<yyyy-mm-dd>-<slug>/prd.md`. Produce it only if the
user wants stakeholder-facing framing; otherwise skip it.

Then present:

1. **Compile first slice into tasks** — delegate to
   [`tasks`](../tasks/SKILL.md) for Slice 1 (`projects/<yyyy-mm-dd>-<slug>/tasks-slice-1.md`)
   to begin execution.
1. **Research another topic** — loop back to Phase 1.
1. **Create another plan** — delegate to `project-plan` again.

## Guidelines

- This skill is a thin coordinator. Research depth lives in
  [`research`](../research/SKILL.md); the spec's structure and acceptance
  criteria in [`to-spec`](../to-spec/SKILL.md); slice, Blocked-by, and
  parallel-execution guidance in [`project-plan`](../project-plan/SKILL.md).
- Wrap all Markdown output at 80 columns.
