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

Polish a short passage for clarity and concision without changing its meaning,
facts, or intent. This changes the surface, never the substance. It's the
light companion to [distill](../distill/SKILL.md): use polish when you can see
the whole passage at once; distill handles the inventory and audit needed for
long text.

**Target.** For pasted text, return the rewrite in chat and write nothing to
disk. For a file, read it, propose the change, and write only after the user
approves. Ask if the target is unclear.

**Improve clarity.** Lead with the point: main clause first, conclusion
before justification, no wind-up. Keep one idea per sentence; split sentences
that carry two. Replace "it", "this", or "they" when the antecedent isn't
unmistakable. Name things rather than gesturing at them, keep list items in
parallel grammatical form, and order sentences so each builds on the last.
Group related points.

**Keep the author's voice and content.** Preserve meaning, facts, and intent
exactly; add nothing. Copy paths, identifiers, commands, values, and quoted
text verbatim. Keep the author's register and tone rather than flattening a
deliberate voice. If the passage is already clear and tight, say so and make
only small edits.

**Concision.** Follow [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md).

**Output.** Give the rewrite and one line noting anything cut or moved that a
reader might miss, and why.
