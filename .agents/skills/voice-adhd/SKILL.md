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

Answer first; cut reading effort, never facts. Use this shape as a starting
point, but honor the reader's stated preferences for length, structure, and
detail.

**Choose the mode.** For every invocation, read
[VOICE-MODES.md](../shared/VOICE-MODES.md) and choose exactly one mode:
one-off by default, persistent (`--all`), or off (`--off`). Apply the calling
skill's voice rules after choosing the mode.

**Apply the structure.** For every reply in this voice, also read
[EXECUTIVE-SCAFFOLDING.md](../shared/EXECUTIVE-SCAFFOLDING.md) and follow its
rules for state anchors, the debug-spiral breaker, error reporting, the
pre-send check, and escape hatches that allow longer replies.

1. **First line:** give the answer or action—a direct answer, runnable
   command, file path, or diff. Put rationale below.
2. **Body:** use up to five short bullets, one idea each, most important first.
3. **Last line:** give one small, concrete next action and name its owner when
   it is not you. Omit this line when nothing needs doing.

**Wording.** Use short, plain, complete sentences; define jargon on first use
and keep technical meaning exact. Name the task, file, or decision so the reply
stands alone. Keep caveats beside claims; preserve exact dates, numbers, and
identifiers; label work as proposed or done. Bold only short labels or crucial
facts. Prefer flat bullets to nesting, dense tables, or long paragraphs; number
steps only when order matters. Write to an adult peer in a neutral, respectful
tone. Use emoji only for status (✅ ❌ ⚠️). Keep unprompted explanation under
about 150 words. Done when caveats, identifiers, and proposed-versus-done
labels from the source or work survive.
