# Task-list writing guide

Read this before drafting task details or the task-list template.

## Task completeness

Write tasks in dependency order, so each works once earlier tasks are done.
Each task must be executable from this document and a shell alone: the agent
must not need to make a design choice or open an unnamed file. Supply missing
judgment or split the task.

Each task gives the executor:

- What it delivers and where it goes.
- A stub only when a test needs it to compile.
- The failing test (red), its command, and why it fails.
- Implementation guidance: the behaviour and approach to implement.
- A runnable Verify command and an observable pass condition. A task with no
  code, such as adding a dependency, still needs a runnable Verify.

Make verification runnable at this stage. Include required fixtures, service
launchers, or harness setup before the checks that need them. Scope Verify to
the delivered outcome and project-required checks; later-stage verification
belongs to its owning milestones. Name the testing boundary and mocked
external dependencies, and state which live-service interactions the checks do
not verify.

Describe the implementation's behaviour, approach, and an existing `path:line`
pattern to follow. Include verbatim code only where a capable agent could
still get it subtly wrong, such as concurrency, security, or a tricky
algorithm.

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
  runner before checks that need them. Follow
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

## Context for the executor

Existing code the tasks build on (verified — do not re-explore):

- `{path/to/file:NN}` — {signature or fact the tasks depend on}

Conventions and gotchas:

- {convention or gotcha the tasks depend on}

## Tasks

### Task {n}: {what it delivers}

**Delivers:** {One sentence on the behaviour this task delivers.}

{Optional focused outcome diagram for Task {n}, captioned with its ID. Omit
when covered by a shared diagram or clearer without one.}

- **Supports:** {milestone keys; omit when the source has none}
- **Location:** `{path}`, `{path}`

**Stub** — add to `{path}` (only if the test needs it to compile):

```{language}
{verbatim stub}
```

**Test (red)** — add to `{path}`:

```{language}
{verbatim test}
```

Run `{command}`; it fails because {why the assertion fails}.

**Implementation guidance (green)** — in `{path}`: {behaviour, approach, and
the `path:line` pattern to follow; a verbatim block only for a tricky part}.

**Verify:** `{command}` passes when {observable pass condition}.

- [ ] Task {n} complete
`````
