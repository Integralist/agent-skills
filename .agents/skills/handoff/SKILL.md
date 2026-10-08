---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
disable-model-invocation: true
argument-hint: What will the next session be used for?
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, which suggests skills that the agent should invoke.

Do not duplicate content already captured in other artifacts (PRDs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

After saving the document, print its full absolute path in a `txt` code
block in the final reply. Include every directory segment and expand `~`
and environment variables. A filename or Markdown link alone is not
sufficient: the user must be able to copy the path without opening the file.

Omit needless words — see [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
