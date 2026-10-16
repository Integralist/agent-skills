# Task List Template

Fill this scaffold. `{...}` are placeholders; repeat the task block for each
task.

`````markdown
# {Feature} — Task List

- **Status:** Ready
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Language:** {detected language}
- **Source:** {plan path and slice, or "in-session discussion"}

## Summary

{Two or three reader-facing sentences.}

## Context for the executor

Existing code the tasks build on (verified — do not re-explore):

- `{path/to/file:NN}` — {signature or fact the tasks depend on}

Conventions and gotchas:

- {convention or gotcha the tasks depend on}

## Tasks

### Task {n}: {what it delivers}

{One or two sentences on the behaviour this task delivers.}

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

Run `{command}`; expect `{assertion failure}`.

**Implementation (green)** — add to `{path}`:

```{language}
{verbatim implementation}
```

**Verify:** `{command}` → `{expected output}`.

- [ ] Task {n} complete
`````
