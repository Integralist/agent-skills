# Project Planning Workspace

This directory contains planning artifacts for repository changes that need more
than a single implementation step. These documents are working material, not
product or user-facing documentation.

Each active project directory also has a `README.md` index. Create it from
[`../.agents/skills/shared/PROJECT-README.md`](../.agents/skills/shared/PROJECT-README.md)
when a skill first creates `projects/<project>/`. The project README owns
navigation and current status; the linked artifacts own their content.

## Structure

Each project uses a date-and-slug directory. The first milestone in a PDD
project may use the unqualified `discovery.md` and `design.md` names; later
milestones use qualified names such as `discovery-m2.md` and `design-m2.md`.

```text
projects/<yyyy-mm-dd>-<slug>/
├── README.md                  # Project index, links, and current status
├── project.md                 # PDD project scope, when applicable
├── discovery[-mN].md          # PDD option evaluation, when applicable
├── design[-mN].md             # PDD approved blueprint, when applicable
├── spec.md                    # Problem, scope, and acceptance criteria
├── plan.md                    # Slices, dependencies, and delivery plan
├── tasks-slice-<n>.md         # Executable tasks for one implementation slice
├── ADR-<NNNN>.md              # Architecture decisions, when needed
└── research.md                # Supporting research, when needed
```

A project may omit artifacts that do not apply. Completed projects move to
`projects/completed/` so the active workspace stays focused.

## Workflow

For a Product-Engineering initiative, use the PDD approval flow first:

1. Agree on scope and milestones in `project.md`.
2. Evaluate solution directions for one milestone in `discovery*.md`.
3. Approve the system-level solution in `design*.md`.
4. Translate the approved Design into `spec.md`.
5. Decompose the work into vertical slices in `plan.md`.
6. Compile one slice at a time into `tasks-slice-<n>.md`.
7. Execute tasks in order with tests and boundary verification.
8. Review and commit the completed slice before compiling the next one.

For an engineering-led project, start at `spec.md` and follow steps 5 through
8. A project README records which workflow applies and the current next action.

The task list is the executor's contract. It names the files, commands, expected
failures, implementation boundaries, and verification checks required to
complete that slice without re-designing it during execution.

## Living specifications

Project documents record the history of a change. Current behaviour belongs in
`docs/specs/<capability>.md`, which is the living source of truth after the
project is complete.

Each project `spec.md` should use a `## Living Specifications` section to name
its relevant living specs and describe what each one owns. If the project does
not change durable behaviour, say that no living capability spec applies and
link to the relevant operational documentation instead.

## Behavioural deltas

When a project changes an existing durable contract, add a
`## Behavioural Delta` section to `spec.md`. Pin the baseline living-spec path
and commit, then use generic operation headings as needed:

- `### ADDED`
- `### MODIFIED`
- `### REMOVED`
- `### RENAMED`

Keep behavior snapshots in fenced `gherkin` blocks. For `MODIFIED`, show the
baseline and updated behavior. For `REMOVED`, record the reason and migration.
For a new capability with no baseline, state that explicitly and use `ADDED` for
the new behavior. Keep the historical acceptance criteria intact; later changes
belong in a follow-on project rather than rewriting a completed project.

## Status

- **Planning** — scope or implementation slices are still being defined.
- **Ready** — the task list is compiled and can be executed.
- **In progress** — execution has started and some tasks are complete.
- **Complete** — all tasks in the project are verified and the project can move
  to `projects/completed/`.

Keep planning documents scoped to the project they describe. Put durable
repository usage instructions in the relevant README or `docs/` document instead
of leaving them only in a project plan.
