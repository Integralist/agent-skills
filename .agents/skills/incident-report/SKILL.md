---
name: incident-report
description: >-
  Write the current session's incident investigation up as a report in
  docs/reports/. Use when the user has been investigating an incident or bug
  in a customer-facing service and asks to write an incident report, document
  the incident, write up what happened, or create a postmortem.
metadata:
  model-tier: complex
---

# Incident Report

Write up an incident researched or debugged in this session as
`docs/reports/<yyyy-mm-dd>-<slug>.md`, covering what broke, when, the
customer impact, the root cause, and the fixes. The session is the source:
assemble what it already established (symptoms, logs, HAR captures, code
paths, causes) rather than starting a new investigation.

1. **Gather the facts** from the conversation, plus the date from
   `date +%F`, the author from `git config user.name`, and a short
   kebab-case slug such as `race-conditions-draft-creation`. When the
   session has no answer for a template field, ask the user: an unverified
   timeline or impact claim is worse than a gap. Done when every field has a
   sourced answer or the user has filled it.
2. **Decide incident or bug.** An incident degraded a customer-facing service,
   so it has a detection time and a period of impact. A bug found before it
   degraded production gets a plain bug report: say so, and drop Severity,
   Detection, and the Timeline's mitigated and resolved rows. Done when the
   report type is chosen.
3. **Write the report** in the template below, following
   [conventions-markdown](../conventions-markdown/SKILL.md) and
   [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md). Cite every factual claim:
   `path/to/file.go:42` for code, log timestamps for events, capture
   filenames for evidence. Label a claim you can't cite "unverified
   assumption", with how to verify it. Done when every `path:line` still
   resolves.
4. **Report the path,** and if the long-term fix warrants a plan, offer the
   to-plan skill. Done when the user has the path.

````md
# {Incident Title}

- **Date:** {date +%F}
- **Author:** {git config user.name}
- **Severity:** {SEV1–4 or your scale, naming the scale}
- **Status:** {Investigating | Mitigated | Resolved}
- **Service:** {customer-facing service affected}
- **Customer(s):** {impacted customers or tenants, or "all"}

## Summary

{What broke and the customer-visible effect, in one paragraph.}

## Timeline

All times UTC.

| Time | Event                                     |
| ---- | ----------------------------------------- |
| {ts} | Incident began (first bad behaviour)      |
| {ts} | Detected ({how: alert, customer report})  |
| {ts} | Mitigated ({what stopped the bleeding})   |
| {ts} | Resolved                                  |

## Impact

{Who was affected, how many, for how long: data loss, correctness, or
availability. Quantify where the session gives numbers.}

## Root Cause

{The underlying cause, not the symptom, with a subsection per distinct cause.}

### Evidence

{Logs, HAR captures, and metrics that pin the cause, in fenced `txt` blocks
with timestamps and the exact error strings.}

### Affected Code

- `path/to/file.go:LINE`: {what this does in the failure}

## Remediation

### Mitigation (short-term)

{What was or should be done now to stop customer impact: rollback, feature
flag, rate limit, config change.}

### Long-term Fix

{The durable fix that prevents recurrence, linking `projects/<slug>/plan.md`
if a plan exists.}

### Prevention

{The detection, test, or process gaps that let this reach customers, and what
closes them.}

## Notes & Caveats

- {Open questions, unrelated findings, unverified assumptions.}
````
