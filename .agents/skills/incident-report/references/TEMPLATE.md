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
