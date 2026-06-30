---
name: research-plan
description: >-
  Two-phase workflow: research topics deeply, then create
  implementation plans. Bootstraps AGENTS.md, produces
  docs/research/ reference docs, and delegates plan creation
  to project-plan. Also handles repo-by-name research.
  Use when the user wants to research a topic, explore a
  repo, create a project plan, or says /research-plan.
---

# Research & Plan

Two-phase coordinator: **research** first, then **plan**. Research
produces deep reference documents; planning consumes them to produce a
precise implementation guide. Each phase is delegated; this file only
sequences them.

## Phase 0: Bootstrap project instructions

Delegate to [`agents-md`](../agents-md/SKILL.md), which reconciles
`AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` so `AGENTS.md` is canonical and
the other two are thin `@AGENTS.md` pointers, bootstrapping any that are
missing. Run it to completion, then prompt:

```txt
What do you want researched?
```

## Phase 1: Research

Delegate to [`research`](../research/SKILL.md). It detects whether the
input is a repo or a topic, gathers project metadata for repos, spawns a
subagent (code research) or runs inline (topic research), and writes
findings to `docs/research/<yyyy-mm-dd>-<slug>.md`. Run it to completion.

After it completes, notify the user and present two options:

1. **Research another topic** — ask what next and loop back to Phase 1.
1. **Create a plan** — proceed to Phase 2.

## Phase 2: Plan

Delegate to [`project-plan`](../project-plan/SKILL.md), passing the build
goal and the Phase 1 research context. It detects the language, embeds
Gherkin acceptance criteria (via
[`behaviour-spec`](../behaviour-spec/SKILL.md)), writes the implementation
guide to `docs/plans/<yyyy-mm-dd>-<plan-slug>.md`, and extracts a formal
ADR/PRD (via [`extract-doc`](../extract-doc/SKILL.md)). Run it to
completion.

After it completes, present two options:

1. **Research another topic** — loop back to Phase 1.
1. **Create another plan** — delegate to `project-plan` again.

## Guidelines

- This skill is a thin coordinator. Research depth lives in
  [`research`](../research/SKILL.md); plan structure, BDD acceptance
  criteria, and parallel-execution guidance live in
  [`project-plan`](../project-plan/SKILL.md).
- Research documents should be exhaustive; plans should be actionable.
- Wrap all Markdown output at 80 columns.
