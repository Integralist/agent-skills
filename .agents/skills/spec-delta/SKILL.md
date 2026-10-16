---
name: spec-delta
description: >-
  MANDATORY before creating, editing, or deleting any file under docs/specs/.
  Records the change as a Behavioural Delta in a projects/<date>-<slug>/ spec.
  Use when a bug fix, refactor, or ad-hoc change touches a living spec.
metadata:
  model-tier: complex
---

# Spec Delta

Record every behaviour change to a living spec in `docs/specs/` as a
Behavioural Delta in a project spec, then make the change. The living spec
holds current truth and moves on; the project spec keeps what it said before
and why it changed, so the history survives.

1. **Classify the edit.** A typo, wording, formatting, or link fix that leaves
   every scenario's meaning intact is editorial: make it and stop. Anything
   that adds, changes, removes, or renames behaviour is a delta. Done when you
   know which it is.

2. **Find the project spec.** Search active `projects/*/spec.md` (not
   `projects/completed/`) for one whose Living Specifications section names
   this living spec, including one written earlier in this session. With
   none, create `projects/<yyyy-mm-dd>-<slug>/`, with the slug naming the
   change, and its README as
   [PROJECTS-README.md](../shared/PROJECTS-README.md) describes. Done when you
   have the project spec that will hold the delta.

3. **Pin the baseline** before editing anything: record
   `git log -1 --format=%H -- <living-spec>` and copy the affected scenarios
   from `git show HEAD:<living-spec>`. Done when you have the commit and the
   scenarios as they stand.

4. **Record the delta** in the project spec as
   [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md) describes. A new project spec
   uses the to-spec skill's template, scaled to the change: keep the header,
   Problem Statement, Solution, Acceptance Criteria, Behavioural Delta, and
   Living Specifications, and drop sections with nothing to say. Done when
   every changed scenario sits under a delta heading, MODIFIED with baseline
   and updated scenarios, REMOVED with reason and migration.

5. **Edit the living spec** to match the delta's updated scenarios. Done when
   the living spec and the delta agree.

The change itself is the implementation, so the project needs no plan or task
list. [PROJECTS-README.md](../shared/PROJECTS-README.md#status) covers marking
it Complete and moving it to `projects/completed/`.
