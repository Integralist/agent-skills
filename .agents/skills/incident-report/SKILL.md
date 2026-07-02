---
name: incident-report
description: >-
  Turn the current session's incident research/debugging into a
  report at docs/reports/. Use when the user has been
  investigating an incident or bug in a customer-facing service
  and wants it written up — "write an incident report", "document
  this incident", "write up what happened", "create a postmortem",
  or /incident-report. Captures what broke, when, customer impact,
  root cause, and mitigations/long-term fixes.
---

# Incident Report

Write up an incident you have been researching or debugging **in the
current session** into a report at
`docs/reports/<yyyy-mm-dd>-<slug>.md`. The session is the source — do
not start a fresh investigation.

## Input

The material is what this session already established: symptoms, logs,
HAR captures, code paths, root causes. Read back over the conversation
and assemble it. If a required field (below) has no answer in the
session, ask the user rather than guessing — an unverified timeline or
impact claim is worse than a gap.

## Gather metadata

- **Date/slug** — `date +%F` for the filename prefix; do not guess.
- **Author** — `git config user.name`.
- **Slug** — short kebab-case of the incident (e.g.
  `race-conditions-draft-creation`).

## Distinguish incident from bug report

An **incident** degraded a customer-facing service — it has a
detection time and a period of impact. If the session describes a bug
that was found but never degraded production, say so and write it up
as a plain bug report (drop Severity, Detection, and the Timeline's
mitigated/resolved rows).

## Verify before asserting

Cite every factual claim: `path/to/file.go:42` for code, log
timestamps for events, capture filenames for evidence. A claim you
cannot cite is labelled "unverified assumption" with how to verify it.
Before finalizing, confirm each `path:line` still resolves.

## Report template

Follow [`markdown-conventions`](../markdown-conventions/SKILL.md) and
[`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).

```markdown
# {Incident Title}

- **Date:** {date +%F}
- **Author:** {git config user.name}
- **Severity:** {SEV1–4 or your scale — state the scale}
- **Status:** {Investigating | Mitigated | Resolved}
- **Service:** {customer-facing service affected}
- **Customer(s):** {impacted customers/tenants, or "all"}

## Summary

{What broke and the customer-visible effect — one paragraph.}

## Timeline

All times UTC.

| Time      | Event                                        |
| --------- | -------------------------------------------- |
| {ts}      | Incident began (first bad behaviour)         |
| {ts}      | Detected ({how — alert, customer report})    |
| {ts}      | Mitigated ({what stopped the bleeding})      |
| {ts}      | Resolved                                     |

## Impact

{Who was affected, how many, for how long. Data loss? Correctness?
Availability? Quantify where the session gives numbers.}

## Root Cause

{The underlying cause, not the symptom. One subsection per distinct
cause if there are several.}

### Evidence

{Logs, HAR captures, metrics that pin the cause — in fenced `txt`
blocks with timestamps. Quote the exact error strings.}

### Affected Code

- `path/to/file.go:LINE` — {what this does in the failure}

## Remediation

### Mitigation (short-term)

{What was or should be done immediately to stop customer impact —
rollback, feature flag, rate limit, config change.}

### Long-term Fix

{The durable fix that prevents recurrence — code change, concurrency
guard, schema change. Link to a plan if one exists:
`docs/plans/...`.}

### Prevention

{Detection, tests, or process gaps that let this reach customers —
missing alert, absent integration test, no canary. What closes them.}

## Notes & Caveats

- {Open questions, unrelated findings, unverified assumptions.}
```

## Finish

Report the written path. If a long-term fix warrants a plan, offer to
invoke [`project-plan`](../project-plan/SKILL.md).
