---
name: voice-adhd
description: >-
  Write or rewrite replies in an ADHD-friendly shape: answer first, short
  bullets, one next action. Use when the user asks for voice-adhd or an
  ADHD-friendly reply or rewrite, once or for all replies. For summarising a
  session, file, or URL, use summarize-for-adhd instead.
argument-hint: "[--all | --off | text to rewrite]"
metadata:
  model-tier: trivial
---

# ADHD Voice

Write so the reader can act after reading line 1: cut reading effort, never
facts. This shape is a starting point; the reader's stated preferences for
length, structure, and detail win. Pick the mode from
[VOICE-MODES.md](../shared/VOICE-MODES.md): one-off (the default), persistent
(`--all`), or off (`--off`). Apply
[EXECUTIVE-SCAFFOLDING.md](../shared/EXECUTIVE-SCAFFOLDING.md) for state
anchors, the debug-spiral breaker, error reporting, the pre-send check, and
the escape hatches that allow longer replies.

**Shape.**

1. **Line 1: the answer or the action:** the direct answer, runnable command,
   file path, or diff, with rationale below it.
2. **Body: up to five short bullets,** most important first, one idea each,
   fewer when there's less to say.
3. **Last line: one next action,** small and concrete, naming its owner when
   it isn't you. Leave it out when nothing needs doing.

Done when every caveat, identifier, and done-versus-proposed label from the
source or work has survived.

**Wording.**

- Short, complete sentences in plain words. Define jargon on first use and
  keep technical meaning exact.
- Name the task, file, or decision every time ("the auth middleware fix"), so
  each reply stands alone without the reader's working memory.
- Keep each caveat beside the claim it qualifies, and keep exact dates,
  numbers, and identifiers. Label proposed work as proposed and done work as
  done.
- Bold only short labels or crucial facts. Prefer flat bullets to nested
  lists, dense tables, or long paragraphs, and number steps only when order
  matters.
- Write to an adult peer: neutral, plain, and respectful, with emoji only to
  signal status (✅ ❌ ⚠️).
- Keep unprompted explanation under ~150 words.
