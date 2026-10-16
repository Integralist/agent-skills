# Compile Slice Tasks

Shared procedure for [`to-tasks`](SKILL.md) and the premium
[`execute-plan`](../execute-plan/SKILL.md) coordinator. Compile one selected
slice; this procedure writes a task document and does not execute it. The
coordinator must inspect that document before delegating implementation.

You already walked the code path while planning this session. `/to-tasks` writes
that walk down as a task list a cheaper model can *retrace* mechanically —
without re-reading the codebase, exploring, or making a design decision. This is
the prewalk trade: pay for exploration once, hand the executor the result.

The primary pattern is **Just-in-Time (JIT) per-slice compilation**: compiling
one vertical slice at a time from a `to-plan` against the live codebase,
producing a self-executing document under `projects/<slug>/`. Producing it and
running it are separate steps — see [Hand-off](SKILL.md#hand-off).

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
2. The planning worked out in the current conversation — crystallize the
   active slice or scope discussed in chat.
3. A full plan or research doc named by the user, or under `projects/` and
   `docs/research/` — fold its detail in.
4. None of the above — stop (see Precondition).

Crystallizing one vertical slice per task file (e.g.,
`projects/<yyyy-mm-dd>-<plan-slug>/tasks-slice-1.md`) prevents stale code in
downstream slices and keeps execution self-contained for a single session or
subagent.

Do not re-derive what the session already settled. Verify specific references
with tools; never re-explore settled ground.

## Milestone coverage

Read the selected slice's outcome milestones, linked spec/research/ADRs,
approved design choices, constraints, and precise `Consumes`/`Produces`, then
inspect live code. The plan provides scope and interfaces, not a duplicate
list of executable steps; put exact file edits, tests/code, and commands here.

Keep milestone IDs and task IDs separate. Use a many-to-many mapping: several
tasks may support one milestone, and one task may support several milestones.
Give every task a `Supports` field referencing its source milestone key(s), and
include a document-level coverage table with task IDs and outcome verification.
Do not copy milestone checkboxes or progress into that table.

Cover every unchecked milestone in the selected slice. Compile the minimum
remaining work from current code, not one task per plan bullet. Preserve and
verify already-completed outcomes without reimplementing them to fill a table;
if evidence is missing, add bounded verification work or ask for a decision.
For checked milestones, record existing verified evidence in coverage instead
of inventing implementation tasks. Preserve stable IDs of existing/committed
tasks when refreshing a document; invalidate stale mappings explicitly.

For legacy `Task N.N` plan bullets, use the existing plan labels as source
milestone keys, qualified by plan/slice. Preserve their text, checked state,
and requirements unless migration is approved. They are not the compiled task
IDs, even when numbers happen to match. Do not silently rename them. For
residual work, `Supports` references original requirement keys rather than
invented slice milestones; standalone scope uses its actual requirement source.

Before finalizing, check every task's source keys exist, no unchecked milestone
is omitted, and every mapped outcome has a verification path grounded in the
spec. Missing detail or a material design/interface change returns to the
premium coordinator/user, not a weaker milestone or an executor's guess.

## Pull request delivery

After decomposing the work into tasks, determine how it should be delivered
using
[`PULL-REQUEST-DELIVERY.md`](../shared/PULL-REQUEST-DELIVERY.md).

Use a confirmed `Pull Request Delivery` mapping from the source plan when one
exists, translating declared slices/milestones into actual compiled task IDs.
If one task spans different declared delivery units, resolve the boundary
before execution rather than choosing a branch by guess. Otherwise assess
the tasks directly. When the guide recommends a stack,
show the proposed task-to-layer grouping and wait for the user to accept,
change, or decline it before writing the document in manual/interactive mode.
For a coordinated `execute-plan` auto invocation, the coordinator resolves and
records grouping under [its auto policy](../execute-plan/references/auto.md)
before compiling; this does not authorize branch changes or stack submission.

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

Load [TEST-CONTRACTS.md](../shared/TEST-CONTRACTS.md) before drafting
verbatim tests.

Order tasks so each is executable once all prior tasks are done; the executor
works top to bottom. Each task carries:

- **Delivers** — a concise summary (1–2 sentences) explaining the behaviour or
  capability the task delivers.
- **Supports** — source milestone key(s), or original requirement keys for
  residual/standalone scope. This maps outcomes, not execution order.
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

For coordinated `execute-plan`, assign stable task identifiers and make each
one a coherent tests-plus-implementation commit boundary. Compile the slice's
whole task list, but execute one task at a time through the coordinator's
verify/commit gate. Workers read the whole document for context without
permission to implement later tasks. Do not split tests and implementation
into separate task commits or invent empty commits for check-only work.
The coordinator owns checkboxes and Git records; retain the template's full
ordered-list protocol for manual execution.

Not every task is code. A dependency add or a config wire has no test — give it
a `Verify` that is still a runnable check (build succeeds, `grep` matches).

## Write the document

When writing task lists under `projects/<yyyy-mm-dd>-<slug>/`, ensure the
project's `README.md` exists. If missing, create it from
[`../shared/PROJECT-README.md`](../shared/PROJECT-README.md), then add or
update one document-level row for the task list in its artifact table. Keep
individual task descriptions and checkboxes only in the task list.

- **Single-slice plan (or standalone tasks)**: If the plan has only one slice
  in total (or the tasks are standalone without a multi-slice plan), write to
  `tasks.md`.
- **Multi-slice plan**: Write each slice to `tasks-slice-<n>.md` (e.g.
  `tasks-slice-1.md`, `tasks-slice-2.md`), even when compiling only one slice.
- **Subsequent slice added / compiled**: If `tasks.md` already exists when
  compiling another slice for the same project directory, rename `tasks.md` to
  `tasks-slice-1.md` before writing the new `tasks-slice-<n>.md`.
- **Residual scope from `execute-plan`**: After planned slices are accepted,
  the coordinator may supply a bounded set of unmet original requirements
  outside slice headings. Compile only those into `tasks-final-verification.md`
  beside the plan, preserving the same task contract and validation bar. Link
  their original requirement IDs; do not invent a new slice or overwrite
  accepted slice task documents. Preserve user edits in an existing residual
  file.

Date from `date +%F`, author from `git config user.name`. A new task list's
`Status` is always `Ready`; the transition to `Complete` follows
[`../shared/PROJECTS-README.md`](../shared/PROJECTS-README.md#status).

Load [`product-voice`](../product-voice/SKILL.md) and write `Summary` immediately
above `Pull Request Delivery`. In 2–3 sentences, explain this slice's problem,
what changes for whom, and why that outcome matters. Ground it in the selected
plan slice or in-session scope, without inventing benefits. Keep implementation
details in `Context for the executor`.

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
