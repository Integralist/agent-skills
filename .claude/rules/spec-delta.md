---
paths:
  - 'docs/specs/**'
---

# Spec Delta

Living specs in `docs/specs/` hold current truth; `projects/` holds the history
of how that truth changed. Every behaviour change to a living spec needs a
project record, so an auditor can see each delta after the living spec moves on.

1. Classify the edit. Wording, typo, formatting, or link fixes that leave every
   scenario's meaning intact are **editorial**: make the edit and stop.
   Anything that adds, changes, removes, or renames behaviour is a **delta**;
   continue.
2. Find the covering project. Search active `projects/*/spec.md` (outside
   `projects/completed/`) for one whose `## Living Specifications` names this
   file, including one written earlier this session by `architect` or
   `to-spec`. If one exists, add this delta to it and go to Step 5.
3. Pin the baseline before editing: record
   `git log -1 --format=%H -- <living-spec>` and copy the affected scenarios
   from `git show HEAD:<living-spec>`.
4. Create `projects/<yyyy-mm-dd>-<slug>/` (date from `date +%F`, slug naming
   the fix). Ensure `projects/README.md` exists, from
   [`PROJECTS-README.md`](../skills/shared/PROJECTS-README.md), and the project
   `README.md`, from [`PROJECT-README.md`](../skills/shared/PROJECT-README.md).
5. Write or extend `spec.md` using the template in
   [`to-spec`](../skills/to-spec/SKILL.md) (Write the spec). Scale it to the fix:
   keep the header bullets, Problem Statement, Solution, Acceptance Criteria,
   Behavioural Delta, and Living Specifications; drop sections with nothing to
   say. Under Behavioural Delta, pin the baseline path and commit from Step 3,
   then use `### ADDED`, `### MODIFIED`, `### REMOVED`, or `### RENAMED`, with
   every snapshot in a fenced `gherkin` block.
6. Edit the living spec to match the delta's updated snapshots.

Done when every scenario changed in the living spec appears under a delta
heading: `MODIFIED` with baseline and updated blocks, `REMOVED` with reason
and migration. The fix itself is the implementation, so the project needs no
`plan.md` or tasks; [`commit`](../skills/commit/SKILL.md) handles the Complete status
and the move to `projects/completed/`.
