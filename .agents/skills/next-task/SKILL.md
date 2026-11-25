---
name: next-task
description: Work on the next task in a plan or task list.
disable-model-invocation: true
argument-hint: "[--plan=<path|#issue|url>] [--github] [steering]"
metadata:
  model-tier: moderate
---

Complete one ready item from a plan or task list, then tick it off. Do one
item per run. Keep implementation and troubleshooting in the main thread.
Delegate test runs as [BUILD-ITEM.md](../shared/BUILD-ITEM.md) describes;
read-only review may also be delegated through
[code-review](../code-review/SKILL.md).

1. **Select the plan.** Use `--plan=<path|#issue|url>`, the plan file or
   GitHub project already active in this session, or ask if none exists. For
   `--github` or an issue reference (`#<n>` or URL), read and follow
   [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and
   Issue Artifacts instead of `projects/`; also follow it when the project is
   already tracked in GitHub Issues (active in this session, named in
   `Execution-Plan: #<n>` commit trailers, or matching an open
   `project`-labelled issue when no local `projects/` folder applies).
2. **Select the item or closing slice.** In a multi-slice file, first route
   any completed slice with missing acceptance or current required review to
   step 4. Otherwise, choose the first unticked item in document order whose
   blocked-by items are done. Name the item and owning slice. If no items
   remain but acceptance is missing, continue at step 4. Also take step 4
   when a required review is missing or stale. If work, acceptance, and due
   review are complete, report that no item is left and stop. If all
   remaining items are blocked, report the blockers and stop.

   Before the owning slice's first edit, record or resume its review baseline
   following [REVIEW-CHANGE.md](../shared/REVIEW-CHANGE.md). Retain that
   baseline across task invocations. The item or closing slice is selected
   only when its review baseline and owner are identified. If on the default
   branch in the main checkout without an approved exception, read and follow
   [worktree-create](../worktree-create/SKILL.md) before editing (use
   [branch](../branch/SKILL.md) only if the user asked to branch in-place or
   has uncommitted changes to carry over).
3. **Build the item.** Follow [BUILD-ITEM.md](../shared/BUILD-ITEM.md).
   Verify it and tick it off only when its own outcome has passing evidence.
4. **Accept a finished slice.** When every item in the owning slice is
   complete, follow [ACCEPT-SLICE.md](../shared/ACCEPT-SLICE.md), including
   on resume when there is no new implementation item. A file without
   slices is one slice. Closure when run standalone includes code-review; an
   active execute-plan coordinator may explicitly own review scheduling.
   Otherwise leave slice acceptance pending. Record acceptance or the
   verification gaps still open.
5. **Report and offer to commit.** Distinguish item completion from slice
   acceptance. State required review status and what is left, then ask
   whether to commit. If the user agrees, read and follow
   [commit](../commit/SKILL.md).
