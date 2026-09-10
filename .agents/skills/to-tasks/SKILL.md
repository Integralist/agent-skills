---
name: to-tasks
description: >-
  Turn the plan already worked out this session into a mechanical,
  TDD-shaped task list a cheaper agent can execute without exploring —
  verbatim tests, verbatim code, and a runnable check per task. Writes
  to projects/<slug>/tasks-slice-<n>.md or projects/<slug>/tasks.md.
disable-model-invocation: true
argument-hint: "[slice scope or plan path]"
---

# To Tasks

You already walked the code path while planning this session. `/to-tasks` writes
that walk down as a task list a cheaper model can *retrace* mechanically —
without re-reading the codebase, exploring, or making a design decision. This is
the prewalk trade: pay for exploration once, hand the executor the result.

The primary pattern is **Just-in-Time (JIT) per-slice compilation**: compiling
one vertical slice at a time from a `to-plan` against the live codebase,
producing a self-executing document under `projects/<slug>/`. Producing it and
running it are separate steps — see [Hand-off](#hand-off).

## Precondition

This is not a planning skill; it crystallizes a plan that already exists and
never invents one. If no plan is in context and none is on disk, stop and point
the user at [`to-plan`](../to-plan/SKILL.md) or
[`architect`](../architect/SKILL.md).

## Input

Take the plan from the first source that exists, in order:

1. **A specific vertical slice from a `to-plan`** (recommended) — pass
   the slice name/number (e.g., `/to-tasks slice-1` or `/to-tasks
   projects/2026-08-28-redis-rate-limiter/plan.md slice-1`). Read the slice's
   `Delivers`, `Consumes`, and `Produces`, then inspect the live repo state to
   ground all references in actual code.
1. The planning worked out in the current conversation — crystallize the
   active slice or scope discussed in chat.
1. A full plan or research doc named by the user, or under `projects/` and
   `docs/research/` — fold its detail in.
1. None of the above — stop (see Precondition).

Crystallizing one vertical slice per task file (e.g.,
`projects/<yyyy-mm-dd>-<plan-slug>/tasks-slice-1.md`) prevents stale code in
downstream slices and keeps execution self-contained for a single session or
subagent.

Do not re-derive what the session already settled. Verify specific references
with tools; never re-explore settled ground.

## Pull request delivery

After decomposing the work into tasks, determine how it should be delivered
using
[`PULL-REQUEST-DELIVERY.md`](../shared/PULL-REQUEST-DELIVERY.md).

Use a confirmed `Pull Request Delivery` mapping from the source plan when one
exists. Otherwise assess the tasks directly. When the guide recommends a stack,
show the proposed task-to-layer grouping and wait for the user to accept,
change, or decline it before writing the document.

Absence of a project plan or delivery mapping never implies a single PR. A
stack layer may contain any number of related tasks.

### Language & convention skills

Auto-detect the primary language from the files the plan touches; proceed unless
the user corrects you.

Explicitly load convention and testing skills before emitting tasks or code:

- **Markdown (always):** Load [`conventions-markdown`](../conventions-markdown/SKILL.md).
- **Go:** If Go, load [`conventions-go`](../conventions-go/SKILL.md) and
  [`go-testing`](../go-testing/SKILL.md) for verbatim code and `Test (red)` tasks.
- **Python:** If Python, load [`conventions-python`](../conventions-python/SKILL.md).
- **SQL:** If schema or migrations are involved, load
  [`conventions-sql`](../conventions-sql/SKILL.md).
- **Mermaid:** If diagrams are included, load
  [`conventions-mermaid`](../conventions-mermaid/SKILL.md).

## The bar

Every task must clear this bar: **a low-capability agent, given only this
document and a shell, can complete it — writing no code of its own invention,
making no design decision, opening no file not named here.** A task that needs a
judgment call, a lookup, or absent context has not cleared it; supply what is
missing or split the task until each piece does.

The passing test is the contract, not the pasted code: if the provided
implementation does not turn the test green, the executor fixes the code, never
the test. This rule ships inside the document — see `TEMPLATE.md`.

## Task anatomy

Order tasks so each is executable once all prior tasks are done; the executor
works top to bottom. Each task carries:

- **Delivers** — a concise summary (1–2 sentences) explaining the behaviour or
  capability the task delivers.
- **Location** — exact path(s), with line anchors when editing existing code.
- **Stub / Signature (if needed)** — type or signature stub so the test compiles
  and fails on assertion.
- **Test (red)** — the failing test verbatim, where it goes, the command that
  runs it, and the failure to expect.
- **Implementation (green)** — the code that passes the test, verbatim, and
  where it goes.
- **Verify** — a runnable check with its expected output: usually the test
  going green; otherwise a build, `grep`, or lint result.

Every vertical slice task list should conclude with an
**Integration / Boundary Verification Task** exercising the completed slice
without mocks.

Not every task is code. A dependency add or a config wire has no test — give it
a `Verify` that is still a runnable check (build succeeds, `grep` matches).

## Write the document

When writing task lists under `projects/<yyyy-mm-dd>-<slug>/`:

- **Single-slice plan (or standalone tasks)**: If the plan has only one slice
  in total (or the tasks are standalone without a multi-slice plan), write to
  `tasks.md`.
- **Multi-slice plan**: Write each slice to `tasks-slice-<n>.md` (e.g.
  `tasks-slice-1.md`, `tasks-slice-2.md`), even when compiling only one slice.
- **Subsequent slice added / compiled**: If `tasks.md` already exists when
  compiling another slice for the same project directory, rename `tasks.md` to
  `tasks-slice-1.md` before writing the new `tasks-slice-<n>.md`.

Date from `date +%F`, author from `git config user.name`. A new task list's
`Status` is always `Ready`; the transition to `Complete` and the move to
`projects/completed/<yyyy-mm-dd>-<slug>/` happen at commit time — see
[`commit`](../commit/SKILL.md).

Follow the scaffold and worked example in [`TEMPLATE.md`](TEMPLATE.md): an
execution protocol the executor follows, a "Context for the executor" section
serializing the exploration (goal, existing signatures, paths, conventions, and
gotchas the tasks depend on), the confirmed pull request delivery mapping, then
the ordered tasks.

## Guidelines

- Exact references only — real signatures, types, import paths, not pseudocode.
  Cite each as `path/to/file.go:42`; before finalizing, confirm every cited
  symbol still resolves, and that every symbol a task invents is spelled
  identically in every later task that uses it.
- Keep the "Context" prose tight — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md) and
  [`conventions-markdown`](../conventions-markdown/SKILL.md).

## Hand-off

`/to-tasks` stops at the document. To run it, point a fresh agent at the path —
[`delegate`](../delegate/SKILL.md), [`next-task`](../next-task/SKILL.md), or a
subagent on a cheap model. The document is self-contained; the executor needs
nothing but the file.
