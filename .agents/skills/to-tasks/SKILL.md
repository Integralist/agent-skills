---
name: to-tasks
description: >-
  Write a step-by-step task list from a plan file or this session's
  discussion.
disable-model-invocation: true
argument-hint: "[plan path] [slice-N]"
metadata:
  model-tier: complex
---

# To Tasks

Turn a plan, or what this session has worked out, into a task list a less
capable agent can implement without a design choice: verbatim tests that fix
the contract, the implementation described precisely, and a runnable check per
task. You walk the code once so the executor doesn't have to. Write the list
and leave running and implementing to the executor; the tests are its gate,
so writing the code yourself only pays for it twice.

**Stop and ask.** Follow the source as given, but when something is missing,
contradictory, or looks like the wrong design, tell the user and wait. Don't
fill the gap with a guess.

**Review first.** Make outcomes skimmable; keep execution contracts complete.
Start each task with its delivered outcome and any useful diagram, then put
its full execution instructions underneath in the same section. Use short
sentences, clear headings, and small, focused bullet groups. Cut repetition,
not requirements or caveats. Brevity limits apply to explanatory prose, not
required technical detail such as signatures, tests, or verification commands.

1. **Pick the source.** Use the file the user names, and the slice they give
   (`slice-N`) if it has slices. With no file, use this session's discussion.
   If neither says enough to build tasks, ask.

2. **Read the code it touches.** Ground every task in live code, not the
   plan's wording. Load the convention and testing skills for each language
   the tasks will contain. Done when you know every signature, path, and test
   pattern the tasks rely on.

3. **Write the tasks** in order, so each works once the ones above it are done.
   Each task must clear the bar: given only this document and a shell, a less
   capable agent can complete it without making a design choice or opening a
   file not named here. If a task needs a judgment call, supply what's missing
   or split it.

   - Give each task the parts shown in the template below: what it
     delivers, its location, a stub if the test needs one to compile, the
     failing test (red) with its command and why it fails, the implementation
     (green), and a runnable Verify. A task with no code, such as adding a
     dependency, still gets a runnable Verify.
   - Describe the implementation: the behaviour, the approach, and an existing
     `path:line` pattern to follow. Write it verbatim only where a capable
     agent could still get it subtly wrong, such as concurrency, security, or
     a tricky algorithm.
   - Choose focused outcome diagrams using
     [OUTCOME-DIAGRAMS.md](../shared/OUTCOME-DIAGRAMS.md): individual, shared,
     mixed, or none according to what helps the reviewer understand the change.
   - Write tests as [TEST-CONTRACTS.md](../shared/TEST-CONTRACTS.md) describes.
   - When the source has milestones, give each task a `Supports:` line naming
     the milestones it serves. The mapping is many-to-many:
     Keep milestone IDs and task IDs separate.
     Cover every unchecked milestone in the slice.
   - Cite existing code as `path:line`. Before finishing, check every cited
     symbol still resolves and every new name is spelled the same in every
     task.
   - End with an **Integration / Boundary Verification Task** that exercises
     the whole slice without mocks. When the spec has Gherkin acceptance
     criteria, this task runs the slice's scenarios under the language's
     runner (godog for Go, as the go-testing skill describes).

4. **Write the file** in the plan's project folder, or a new
   `projects/<yyyy-mm-dd>-<slug>/` when there's no plan:

   - `tasks.md` for a single-slice plan or a session's discussion.
   - `tasks-slice-<n>.md` for a multi-slice plan. If `tasks.md` already exists
     there, rename it to `tasks-slice-1.md` first.

   Fill the header from `date +%F` and `git config user.name`, with Status
   `Ready`. Write the Summary with the voice-product skill: two or three
   sentences on the problem, what changes for whom, and why it matters. Add
   the task list to the project README as
   [PROJECTS-README.md](../shared/PROJECTS-README.md) describes. Done when the
   file is written and you've shared its path.

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

**Implementation (green)** — in `{path}`: {behaviour, approach, and the
`path:line` pattern to follow; a verbatim block only for a tricky part}.

**Verify:** `{command}` passes when {observable pass condition}.

- [ ] Task {n} complete
`````
