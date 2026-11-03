# Update and verify instruction files

## Full Update

Audit structure, then freshness read-only, then lessons. Collect all proposed
changes; request one confirmation before writing.

1. **Audit structure.** Apply the [reconciliation rubric](RECONCILE.md#keep-only-high-value-guidance)
   and [file-placement rules](RECONCILE.md#stubs-and-copilot) to the existing
   files.
2. **Check freshness.** Read-only: verify claims already in `AGENTS.md` against
   the relevant source or docs. Don't list commands, entry points, or
   repository structure just to add them. For each claim, check that it remains
   accurate and is not readily discoverable elsewhere; propose a source pointer
   or removal when it is. Cite evidence. For a large repo, delegate review-only
   checks following
   [SUBAGENT-STEERABILITY.md](../../shared/SUBAGENT-STEERABILITY.md).
3. **Harvest session lessons.** Propose durable, non-obvious facts from this
   session that could change an agent's decision or prevent a costly mistake.
   Exclude facts shown by code or existing docs. Include commands only when the
   important invocation or gotcha isn't documented in the source. Propose each,
   or explicitly say this step is skipped if none qualify.
4. **Confirm and write.** Show the combined diff or a short summary. Write only
   after the user confirms, then run the shared verification checklist below.

## `--learn`

Run only step 3 against the existing `AGENTS.md`, then use the same confirmation
gate. If `AGENTS.md` is missing, tell the user and choose a mode normally.

## Verify after any write

Run the [shared verification checklist](RECONCILE.md#verify-after-any-write).

Finish by reporting which file is canonical, what moved, and what was created.
