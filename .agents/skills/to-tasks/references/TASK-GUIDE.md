# Task-list writing guide

Read this before drafting task details or the task-list template.

## Task completeness

Write tasks in dependency order, so each works once earlier tasks are done.
Each task must be executable from this document and a shell alone: the agent
must not need to make a design choice or open an unnamed file. Supply missing
judgment or split the task.

Follow [CONCISE-PROSE.md](../../shared/CONCISE-PROSE.md) and
[PR-DESCRIPTION.md](../../shared/PR-DESCRIPTION.md) for the two-layer layout:
keep the visible top short (<= 220 words per task: `Problem`, `Solution`,
optional `Notes`, `Supports`, `Location`, and one-line `Verify`) with blank
lines between bullets, and place `Stub`, `Test (red)`, and `Implementation
guidance (green)` inside `<details>`. Never copy `AGENTS.md`, PR rules, or
approval reminders into task bodies—link `AGENTS.md` once if a task needs a
repo-specific rule.

Apply the same brevity and clarity inside `<details>`: use only the template
sections below (plus optional `Prerequisites` in 1–3 short bullets when a task
needs task-specific setup). Write `Prerequisites`, `Test (red)` framing,
`Implementation guidance (green)`, and `Verify` as short, flat bullets—one
action per bullet, no prose paragraphs or defensive disclaimers.

Each task gives the executor:

- **Visible top:** `Problem` (brief system/context intro + why the task
  exists, explaining non-obvious terms on first use), `Solution` (what changes
  and what stays untouched), optional `Notes`, `Supports` (milestone keys),
  `Location`, and a runnable `Verify` command with its pass condition.
- **Collapsed detail:** a stub only when needed to compile, the failing
  test (red) and why it fails, and implementation guidance (`path:line` pattern
  to follow; verbatim code only for tricky security or concurrency parts).

Include required fixtures, service launchers, or harness setup before the
checks that need them. Scope Verify to the delivered outcome and
project-required checks; later-stage verification belongs to its owning
milestones. Name the testing boundary and mocked external dependencies, and
state which live-service interactions the checks do not verify—in one concise
line per task rather than a repeated boilerplate paragraph.

## Contracts and coverage

- Choose focused outcome diagrams using
  [OUTCOME-DIAGRAMS.md](../../shared/OUTCOME-DIAGRAMS.md): individual, shared,
  mixed, or none, according to what helps the reviewer understand the change.
- Write tests as described in
  [TEST-CONTRACTS.md](../../shared/TEST-CONTRACTS.md).
- When the source has milestones, include `Supports:` with the milestone keys
  each task serves. Mapping is many-to-many; milestone IDs and task IDs stay
  separate. Cover every unchecked milestone in the slice.
- Cite existing code as `path:line`. Before finishing, check every cited
  symbol still resolves and every new name is spelled consistently.
- Include tasks for missing acceptance steps, fixtures, and the minimum
  runner before checks that need them. Read and follow
  [conventions-acceptance-tests](../../conventions-acceptance-tests/SKILL.md),
  including for Make/Bash workflows. Carry forward the plan's acceptance
  mapping; if absent, derive it from the slice's criteria before handoff.
- End with an **Integration / Boundary Verification Task** following
  [ACCEPT-SLICE.md](../../shared/ACCEPT-SLICE.md). Run the canonical living
  features assigned to the slice directly. Name expected scenarios and example
  rows so the executor can verify coverage, not only exit zero. When no
  feature applies, name equivalent executable assertions and explain why.

## Task-list template

`{...}` are placeholders; repeat the task block for each task.

`````markdown
# {Feature} — Task List

- **Status:** Ready
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language}
- **Source:** {plan path and slice, or "in-session discussion"}

## Summary

{Two or three reader-facing sentences.}

{Optional shared outcome diagram: caption the covered task IDs, then a fenced
Mermaid block. Omit when better covered beside the relevant tasks.}

## Starting Context

Existing code the tasks build on (verified — do not re-explore):

- `{path/to/file:NN}` — {signature or fact the tasks depend on}

Conventions and gotchas:

- {convention or gotcha the tasks depend on}

## Tasks

### Task {n}: {what it delivers}

#### Problem

{1–2 plain sentences introducing the system/context and what is missing or
broken, explaining unfamiliar terms on first use.}

- **Blocked by:** {previous task or "None"}

- **Supports:** {milestone keys; omit when the source has none}

#### Solution

{1–2 plain sentences on what changes and what stays untouched.}

{Optional focused outcome diagram for Task {n}, captioned with its ID. Omit
when covered by a shared diagram or clearer without one.}

- **Location:** `{path}`, `{path}`

- **Verify:** `{command}` passes when {observable pass condition}.

#### Notes

- {Optional 1–2 short boundary or scope bullets; omit if none.}

<details>
<summary>Stub, test, and implementation details</summary>

**Stub** — add to `{path}` (only if the test needs it to compile):

```{language}
{verbatim stub}
```

**Test (red)** — add to `{path}`:

```{language}
{verbatim test}
```

Run `{command}`; it fails because {why the assertion fails}.

**Implementation guidance (green)** — short bullets in `{path}`:

- {step or `path:line` pattern to follow}
- {tricky security/concurrency snippet only if needed}

</details>

- [ ] Task {n} complete
`````
