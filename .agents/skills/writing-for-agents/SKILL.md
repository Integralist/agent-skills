---
name: writing-for-agents
description: >-
  MANDATORY for any work on agent-facing documents. Load this before creating
  or editing a skill, or modifying AGENTS.md, CLAUDE.md, or GEMINI.md.
metadata:
  model-tier: moderate
---

Write agent-facing documents so a human can understand their purpose,
boundaries, and deliverable in one pass, and an agent can carry them out.
Explain the outcome; prescribe the method where correctness or safety depends
on it.

**Keep visible.** Open with the purpose, without a title that merely repeats
it. Keep scope, consequential decisions, approval gates, and the deliverable
in the main file. These are the human-visible contract, not procedural detail.

**Separate detail.** Move detailed procedures, standards, and templates into
references, even when every run needs them. Link each skill's own references
directly from `SKILL.md` and say when to read each: before a named action, or
only for a named case. Group details used together rather than making a file
per heading. Required references shorten human reading, not total agent
context; conditional ones can shorten both.

**Before drafting.** Read and follow the [writing guide](references/WRITING.md).
Before changing skill frontmatter, also read
[skill mechanics](SKILL-MECHANICS.md).
