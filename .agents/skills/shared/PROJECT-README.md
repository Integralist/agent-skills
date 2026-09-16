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
| [{artifact filename}](./{artifact filename}) | {purpose} | {status} |

Replace the placeholder row with one row for each actual artifact. Remove rows
for artifacts that do not apply; never leave a placeholder or link to a file
that does not exist. Use the actual filename for each workflow:

- Single-slice tasks: `tasks.md`
- Multi-slice tasks: `tasks-slice-N.md`
- Single-milestone PDD: `discovery.md` and `design.md`
- Qualified PDD milestones: `discovery-mN.md` and `design-mN.md`

These rows track document lifecycle only; do not copy task descriptions,
checkboxes, or slice-level progress into this README. The task file remains the
source of truth for task state.

## Next action

{One coarse workflow pointer, such as "Run `/next-task` against
`tasks-slice-1.md`" or the reason the project is waiting for approval.}

## References

- {Related living specification, issue, design, or external reference.}
