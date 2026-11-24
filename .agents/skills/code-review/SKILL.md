---
name: code-review
description: >-
  Review a PR or local changes with risk-based read-only reviewers, verify
  findings, and check the change against its project's spec and plan. Use when
  reviewing a remote PR or local code, including unpushed or
  uncommitted changes, or triaging feedback and scanner findings (--feedback).
  Pass --plan=<path> to name the plan or task list.
argument-hint: "[--feedback] [--branch | --uncommitted | --all-changes | --baseline=<commit> | --target=<path|pr-url>] [--plan=<path>] [steering]"
metadata:
  model-tier: complex
---

Review a PR or local changes for defects, convention violations, and gaps
against project intent.

**Feedback mode (`--feedback`).** When the user passes the flag or asks to
assess feedback or scan findings, follow [FEEDBACK.md](references/FEEDBACK.md)
instead of running a fresh review. Use the supplied target as context. Ask
for missing feedback or unclear scope. Edits and replies require approval.
For security items from review, scanners, or audits, also read
[SECURITY-FEEDBACK.md](references/SECURITY-FEEDBACK.md) during verification.

**Standard review.** Use read-only reviewers. **Never edit code, change
state, or comment on a PR.**

Before reviewing, read [REVIEW-PROTOCOL.md](references/REVIEW-PROTOCOL.md) for
intent collection, reviewer roles, finding/verification rules, and the report
template. Use [MODES.md](references/MODES.md) to resolve source commands. When
conventions apply, read [CONVENTIONS.md](references/CONVENTIONS.md) to select
and load their guidance.

## Choose the source

| Argument | Source |
| --- | --- |
| `--target=<pr-url>` or `--target=<owner/repo#number>` | Remote PR |
| `--branch` | Local branch vs. default branch |
| `--uncommitted` | Working-tree changes |
| `--all-changes` | Local branch plus working tree |
| `--baseline=<commit>` | Recorded execution and manifest |
| `--target=<path>` or `--target=<glob>` | Explicit paths |

If no source argument is given and the user has not named a target, ask the
user which source to review before continuing. Use `--plan=<path>` to name a
plan or task list for intent review.

## Coordinate the review

1. **Snapshot.** Use the source commands in [MODES.md](references/MODES.md) to
   resolve the source. Write the whole diff once to `DIFF_PATH` and create the
   changed-file list. For `--baseline`, require the
   delivery manifest and baseline snapshots; never silently mix revisions. If
   the diff is empty and no files match, report “No changes to review” and stop.
2. **Gather intent.** Use the linked protocol to collect intent at the reviewed
   revision and write `CONTEXT_PATH`.
3. **Choose reviewers.** Start one read-only generalist reviewer. Add specialists
   for concrete risks, and a separate conventions reviewer whenever applicable
   conventions exist—even for small, low-risk changes. Use the protocol's roles,
   prompts, and completion checks. For behavioural changes (skipping pure docs,
   comment-only, or formatting diffs), also start a separate read-only
   adversarial safety reviewer to read and follow
   [is-it-safe](../is-it-safe/SKILL.md). For substantial or cross-cutting
   intent, add
   a separate spec-and-plan reviewer; otherwise keep those checks with the
   generalist. Unavailable guidance is not a clean pass.
4. **Verify findings.** Have a verifier refute each finding using the protocol.
   Report only verified real findings; keep unresolved questions separate.
5. **Report.** Use the protocol's report template. Account for every changed
   file, merge duplicate findings, sort by severity, and offer to address
   actionable findings.

Every selected reviewer must finish `COMPLETE`; every changed file needs
reviewer coverage or a reason for skipping. Close convention-loading omissions
before reporting. Keep unknowns separate from defects.
