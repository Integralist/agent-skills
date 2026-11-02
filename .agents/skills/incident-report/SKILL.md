---
name: incident-report
description: >-
  Write the current session's incident investigation up as a report in
  docs/reports/. Use when the user has been investigating an incident or bug
  in a customer-facing service and asks to write an incident report, document
  the incident, write up what happened, or create a postmortem.
metadata:
  model-tier: moderate
---

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
3. **Write the report** using [the template](references/TEMPLATE.md), following
   [conventions-markdown](../conventions-markdown/SKILL.md) and
   [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md). Cite every factual claim:
   `path/to/file.go:42` for code, log timestamps for events, capture
   filenames for evidence. Label any uncited claim "unverified assumption"
   and say how to verify it. Done when every `path:line` resolves.
4. **Report the path,** and offer to-plan if a long-term fix warrants it.
   Done when the path is reported.
