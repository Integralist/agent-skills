---
name: recap
description: Recap the current session — what's done, in progress, and next.
disable-model-invocation: true
argument-hint: (optional) a specific thread or task to recap
metadata:
  model-tier: trivial
---

Summarise the current session in chat; do not write a file. For a durable
handoff document, use `handoff`. If an argument names a specific task or
thread, recap only that.

Before writing, read [EXECUTIVE-SCAFFOLDING.md](../shared/EXECUTIVE-SCAFFOLDING.md)
to keep state visible and reduce working-memory burden.

Use three headings, each with a short bullet list:

- **Done** — what's finished and verified, in concrete terms.
- **In progress** — what's underway and where it stands.
- **Next** — the immediate next action, scoped to a file or command.

Lead with state, not narration. Keep the whole recap to about 10 lines. Omit
any heading with nothing under it.
