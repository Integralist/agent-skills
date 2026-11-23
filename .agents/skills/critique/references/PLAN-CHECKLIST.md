# Plan Execution Quality Checklist

Apply only when critiquing implementation plans or task lists (`plan.md`,
`tasks*.md`, or slice/milestone documents):

- Scope drift into unrequested refactors, renames, or cleanup.
- Required files missing from the File Changes table.
- Tasks or milestones without pass/fail signals (e.g. "improve X", "clean up Y")
  or `**Verify:**` lines lacking a command and expected output.
- Dependencies on another slice's task, file, type, or contract missing from
  Blocked by, Consumes, or Produces.
- Application integration coverage missing a runnable local path, named real
  layers and mocked upstreams, contract checks, or isolated lifecycle commands.
  Flag handler-only mocks labelled as end-to-end evidence, live-service
  fallback, or a required harness deferred past the slice that needs it
  (respect recorded non-applicability and agreed exceptions).
- Missing error paths, partial failures, concurrent callers, rollback, or
  existing-data migration cases.
- Bloat: shared plan sections or repo-rule boilerplate copied into
  slices/tasks instead of linked, or dense contracts left uncollapsed.
