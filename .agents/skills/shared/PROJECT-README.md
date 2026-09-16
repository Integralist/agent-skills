# {Project name}

This README is the index for the project workspace. Keep it current as
artifacts are created, approved, run, or superseded. The artifacts
contain the source material; this file contains the navigation and current
state.

- **Status:** {Planning | Ready | In progress | Complete}
- **Owner:** {owner}
- **Created:** {YYYY-MM-DD}
- **Updated:** {YYYY-MM-DD}

## Summary

{One paragraph describing the problem, intended outcome, and project scope.}

## Workflow status

{For a PDD project, use the approval table below. For an engineering-led
project, describe the current spec, plan, or implementation state instead.}

### PDD approval status (PDD projects only)

Remove this section for engineering-led projects. For PDD projects, use:

| Stage | Scope | Status | Artifact |
| --- | --- | --- | --- |
| Project | Whole initiative | {Not started} | [project.md](./project.md) |
| Discovery | {Milestone} | {Not started} | {link or —} |
| Design | {Milestone} | {Not started} | {link or —} |

Use `Not started`, `Draft`, `Awaiting approval`, `Approved`, `Needs revision`,
or `Superseded`. `Approved` requires explicit Product/Engineering approval;
creating a document does not approve it.

## Artifacts

For engineering-led artifacts, use document statuses such as `Draft`, `Ready`,
`In progress`, and `Complete`. These describe the artifact as a whole, not
individual task state.

| Artifact | Purpose | Status |
| --- | --- | --- |
| [project.md](./project.md) | Project scope, milestones, and outcomes | {status} |
| [spec.md](./spec.md) | Stable behavior and acceptance criteria | {status or —} |
| [plan.md](./plan.md) | Implementation slices and dependencies | {status or —} |
| [tasks.md](./tasks.md) | Executable tasks for the next slice | {status or —} |

Add one row for each discovery, design, research, ADR, PRD, and slice-specific
task file as it is created. Remove placeholder rows for artifacts that do not
apply. These rows track document lifecycle only; do not copy task descriptions,
checkboxes, or slice-level progress into this README. The task file remains the
source of truth for task state.

## Next action

{One coarse workflow pointer, such as "Run `/next-task` against
`tasks-slice-1.md`" or the reason the project is waiting for approval.}

## References

- {Related living specification, issue, design, or external reference.}
