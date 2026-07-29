---
name: recap
description: Recap the current session — what's done, in progress, and next.
disable-model-invocation: true
argument-hint: (optional) a specific thread or task to recap
---

Summarise the current session in chat. Do not write a file — for a
durable handoff document, that's `handoff`.

Structure the recap under three headings, each a short bullet list:

- **Done** — what's finished and verified, in concrete terms.
- **In progress** — what's underway and where it stands.
- **Next** — the immediate next action, scoped to a file or command.

Lead with state, not narration. Keep the whole thing to ~10 lines;
omit a heading that has nothing under it. If arguments name a specific
task or thread, recap only that.
