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
produces deep reference documents; planning consumes those documents to
produce a precise implementation guide. Each phase is delegated to a
focused skill — this file just sequences them.

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
and writes findings to `docs/research/<yyyy-mm-dd>-<slug>.md`.

Run that skill to completion before continuing.

### After research completes

Notify the user that research is done, then present two options:

1. **Research another topic** — ask what to research next and
   loop back to Phase 1.
1. **Create a plan** — proceed to Phase 2.

## Phase 2: Plan

Delegate to the [`project-plan`](../project-plan/SKILL.md) skill,
passing the build goal and the research context gathered in Phase 1. It
detects the language, embeds Gherkin acceptance criteria (via
[`behaviour-spec`](../behaviour-spec/SKILL.md)), writes the
implementation guide to `docs/plans/<yyyy-mm-dd>-<plan-slug>.md`, and
extracts a formal ADR/PRD (via [`extract-doc`](../extract-doc/SKILL.md)).

Run that skill to completion.

### After plan completes

Once `project-plan` reports the plan and its formal documents are done,
present two options:

1. **Research another topic** — loop back to Phase 1.
1. **Create another plan** — delegate to `project-plan` again.

## Guidelines

- This skill is a coordinator. Research depth lives in
  [`research`](../research/SKILL.md); plan structure, BDD acceptance
  criteria, and parallel-execution guidance live in
  [`project-plan`](../project-plan/SKILL.md). Keep this file thin.
- Research documents should be exhaustive; plans should be actionable.
- Wrap all Markdown output at 80 columns.
