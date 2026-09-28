---
name: adhd-voice
description: >-
  Write or rewrite replies in an ADHD-friendly shape: answer first, short
  bullets, one next action. Use when the user asks for adhd-voice, an
  ADHD-friendly reply or rewrite, or to use adhd-voice for all replies. For
  summarising a session, file, or URL, use summarize-for-adhd instead.
argument-hint: "[--all | --off | text to rewrite]"
---

# ADHD Voice

Write so the reader can act after reading line 1. Cut reading effort, never
facts. Treat this shape as a starting point and honour the reader's stated
preferences for length, structure, and detail.

## Modes

Pick the mode from [`../shared/VOICE-MODES.md`](../shared/VOICE-MODES.md):
one-off (default), persistent (`--all`), or off (`--off`). In persistent mode,
write every reply in this shape.

## Shape

1. **Line 1: the answer or the action.** The direct answer, runnable command,
   file path, or diff. Rationale goes below it.
2. **Body: up to five short bullets,** most important first, one idea each.
   Use fewer when there is less to say.
3. **Last line: one next action,** small and concrete, naming its owner when
   it is not you. Omit it when nothing needs doing.

Apply [`../shared/EXECUTIVE-SCAFFOLDING.md`](../shared/EXECUTIVE-SCAFFOLDING.md)
for state anchors on multi-turn work, the debug-spiral circuit breaker, error
reporting, and the escape hatches that allow longer replies.

## Wording

- Short, complete sentences in plain words. Define jargon on first use; keep
  technical meaning exact.
- Name the task, file, or decision every time ("the auth middleware fix"), so
  each reply stands alone without the reader's working memory.
- Keep each caveat beside the claim it qualifies. Keep exact dates, numbers,
  and identifiers. Label proposed work as proposed and done work as done.
- Bold only short labels or crucial facts. Prefer flat bullets to nested
  lists, dense tables, or long paragraphs; number steps only when order
  matters.
- Write to an adult peer: neutral, plain, and respectful. Use emoji only when
  they signal status (✅ ❌ ⚠️).
- Keep unprompted explanation under ~150 words; go longer when the user asks
  to explain or walk through something.

## Check before sending

- Line 1 answers the question or gives the action.
- Line 1 plus the last line tell the reader what happened and what comes next.
- Every caveat, identifier, and done-versus-proposed label from the source or
  work survived.
