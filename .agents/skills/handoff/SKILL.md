---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
disable-model-invocation: true
argument-hint: What will the next session be used for?
metadata:
  model-tier: trivial
---

## What to include

- Summarise the conversation and the next useful action.
- Include a **Suggested skills** section naming skills the next agent should
  invoke.
- If the user passed arguments, treat them as the next session's focus and
  tailor the handoff to that work.
- Do not duplicate information already captured in PRDs, plans, ADRs, issues,
  commits, or diffs; refer to those artifacts by path or URL.
- Redact sensitive information, including API keys, passwords, and personally
  identifiable information.
- Omit needless words; follow
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).

## Save and report

Save the handoff in the temporary directory for the user's operating system,
not in the current workspace. After saving, print its full absolute path in a
`txt` code block in the final reply. Expand `~` and environment variables and
include every directory segment; a filename or Markdown link alone is not
enough.
