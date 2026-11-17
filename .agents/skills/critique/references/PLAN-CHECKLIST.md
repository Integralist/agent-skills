# Plan Execution Quality Checklist

Apply these checks only when critiquing implementation plans or task lists
(`plan.md`, `tasks*.md`, or documents built from slices, milestones, tasks,
and a File Changes table):

- Scope drift into unnecessary refactors, renames, or cleanup.
- Required files missing from the File Changes table.
- Tasks or milestones without pass/fail signals, such as "improve X" or
  "clean up Y".
- Uncheckable milestones or `**Verify:**` lines without a command and expected
  output.
- Dependencies on another slice's task, file, type, or contract that are absent
  from Blocked by, Consumes, or Produces.
- Missing error paths, partial failures, concurrent callers, rollback, or
  existing-data migration cases.
- Duplication or bloat: shared plan sections or repo-rule boilerplate copied
  into slices/tasks instead of linked, or dense contracts not collapsed under
  `<details>`.
