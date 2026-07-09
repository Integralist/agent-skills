---
name: architect
description: >-
  Architect a change from idea to actionable artifacts — bootstrap
  project instructions, research deeply, write a spec, then an
  implementation plan, each delegated to its skill. Use when the user
  wants to research a topic, explore a repo, write a spec, create a
  project plan, or says /architect.
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

## Phase 1: Research

Delegate to [`research`](../research/SKILL.md). It detects whether the input is
a repo or a topic, gathers project metadata for repos, and writes findings to
`docs/research/<yyyy-mm-dd>-<slug>.md`. Run it to completion, then present:

1. **Research another topic** — ask what next and loop back to Phase 1.
1. **Write a spec** — proceed to Phase 2.

## Phase 2: Spec

Delegate to [`to-spec`](../to-spec/SKILL.md), passing the build goal and the
Phase 1 research context. It writes the problem, solution, user stories,
acceptance criteria (via [`behaviour-spec`](../behaviour-spec/SKILL.md)), testing
seams, and scope to `docs/specifications/<yyyy-mm-dd>-<slug>.md`. Run it to
completion, then present:

1. **Refine the spec or research more** — loop back to Phase 1 or 2.
1. **Create a plan** — proceed to Phase 3.

## Phase 3: Plan

Delegate to [`project-plan`](../project-plan/SKILL.md), passing the build goal,
the spec, and the research context. It decomposes the work into vertical slices
with Blocked-by edges, points to the spec for acceptance criteria, and extracts
ADRs via [`to-adr`](../to-adr/SKILL.md). Run it to completion.

## Offer a PRD

After the plan, offer [`to-prd`](../to-prd/SKILL.md) as an opt-in step — a
focused product framing (goals, success metrics, audience) sourced from the
spec. Produce it only if the user wants stakeholder-facing framing; otherwise
skip it.

Then present:

1. **Research another topic** — loop back to Phase 1.
1. **Create another plan** — delegate to `project-plan` again.

## Guidelines

- This skill is a thin coordinator. Research depth lives in
  [`research`](../research/SKILL.md); the spec's structure and acceptance
  criteria in [`to-spec`](../to-spec/SKILL.md); slice, Blocked-by, and
  parallel-execution guidance in [`project-plan`](../project-plan/SKILL.md).
- Wrap all Markdown output at 80 columns.
