# Project Planning Workspace

This directory contains planning artifacts for repository changes that need
more than a single implementation step. These documents are working material,
not product or user-facing documentation.

## Structure

Each project uses a date-and-slug directory:

```text
projects/<yyyy-mm-dd>-<slug>/
├── spec.md                    # Problem, scope, and acceptance criteria
├── plan.md                    # Slices, dependencies, and delivery plan
├── tasks-slice-<n>.md         # Executable tasks for one implementation slice
├── adr-<decision>.md          # Architecture decisions, when needed
└── research.md                # Supporting research, when needed
```

A project may omit artifacts that do not apply. Completed projects move to
`projects/completed/` so the active workspace stays focused.

## Workflow

Use the artifacts in this order:

1. Define the problem and acceptance criteria in `spec.md`.
1. Decompose the work into vertical slices in `plan.md`.
1. Compile one slice at a time into `tasks-slice-<n>.md`.
1. Execute tasks in order with tests and boundary verification.
1. Review and commit the completed slice before compiling the next one.

The task list is the executor's contract. It names the files, commands,
expected failures, implementation boundaries, and verification checks required
to complete that slice without re-designing it during execution.

## Status

- **Planning** — scope or implementation slices are still being defined.
- **Ready** — the task list is compiled and can be executed.
- **In progress** — execution has started and some tasks are complete.
- **Complete** — all tasks in the project are verified and the project can move
  to `projects/completed/`.

Keep planning documents scoped to the project they describe. Put durable
repository usage instructions in the relevant README or `docs/` document
instead of leaving them only in a project plan.
