---
paths:
  - 'docs/specs/**'
---

Before changing a living spec in `docs/specs/`, record every behaviour change
as a Behavioural Delta in a project spec, then make the change. The living
spec holds current truth and moves on; the project spec preserves what it said
before and why it changed.

## Record and apply the delta

1. **Classify the edit.** A typo, wording, formatting, or link fix that leaves
   every scenario's meaning intact is editorial: make the edit and stop.
   Anything that adds, changes, removes, or renames behaviour is a delta.
2. **Find the project spec.** Search active `projects/*/spec.md` files, not
   `projects/completed/`, for one whose Living Specifications section names
   this living spec. Include project specs written earlier in this session.
   If none exists, create `projects/<yyyy-mm-dd>-<slug>/`; the slug names the
   change, and create its README as
   [PROJECTS-README.md](../skills/shared/PROJECTS-README.md) describes. For `github`
   or an issue reference (`#<n>` or URL), read and follow
   [GITHUB-ISSUES.md](../skills/shared/GITHUB-ISSUES.md) to use GitHub Issues and
   Issue Artifacts instead of `projects/`.
3. **Pin the baseline before editing anything.** Record
   `git log -1 --format=%H -- <living-spec>` and copy the affected scenarios
   from `git show HEAD:<living-spec>`.
4. **Record the delta** in the project spec using
   [SPEC-FORMAT.md](../skills/shared/SPEC-FORMAT.md). For a new project spec, use the
   [to-spec template](../skills/to-spec/references/SPEC-GUIDE.md#spec-template),
   scaled to this change: keep the header, Problem
   Statement, Solution, Acceptance Criteria, Behavioural Delta, and Living
   Specifications; omit sections with nothing to say. Put every changed
   scenario under a delta heading: `MODIFIED` includes baseline and updated
   scenarios; `REMOVED` includes the reason and migration.
5. **Edit the living spec** so it matches the delta's updated scenarios.
   The project needs no plan or task list because the change itself is the
   implementation.

Use [PROJECTS-README.md](../skills/shared/PROJECTS-README.md#status) to mark the
project Complete and move it to `projects/completed/`.
