---
name: polish
description: >-
  Rewrite a short passage (a paragraph, prompt, message, or comment) for
  clarity and concision without changing its meaning. Use for short prose
  where clarity matters more than preserving every detail; use distill for
  long text.
disable-model-invocation: true
argument-hint: "[file path | pasted text]"
metadata:
  model-tier: trivial
---

# Polish

Rewrite a short passage to be clearer and tighter without changing its
meaning, facts, or intent: polish the surface, never the substance. It's the
light companion to [distill](../distill/SKILL.md), skipping distill's
inventory and audit, so use it for prose you can see whole at once.

**Target.** For pasted text, give the rewrite in chat and write nothing to
disk. For a file, read it, propose the change, and write it only once the
user approves. Ask when it's unclear which.

**Clarity,** since concision alone can leave prose short but murky:

- Lead with the point: main clause first, conclusion before its
  justification, no wind-up.
- One idea per sentence; split a sentence that carries two.
- Replace an "it", "this", or "they" with its noun when the antecedent isn't
  unmistakable.
- Name the thing rather than gesture at it.
- Give items in a list or series the same grammatical shape.
- Order sentences so each builds on the last, grouping related points.

**Concision.** Omit needless words, following
[CONCISE-PROSE.md](../shared/CONCISE-PROSE.md).

**Keep the author's.** Keep meaning, facts, and intent exactly, adding
nothing that isn't there. Copy paths, identifiers, commands, values, and
quoted text verbatim. Sharpen within the author's register and tone rather
than flattening a deliberate voice. If the passage is already clear and
tight, say so and make only small edits.

**Output.** The rewrite, plus one line noting anything cut or moved that a
reader might miss, and why.
