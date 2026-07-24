---
name: polish
description: >-
  Rewrite a short passage — a paragraph, prompt, message, or comment —
  for clarity and concision without changing its meaning. The light
  companion to distill, for short prose where clarity, not preservation,
  is the concern.
disable-model-invocation: true
argument-hint: "[file path | pasted text]"
---

# Polish

Rewrite a short passage to be clearer and tighter **without changing its
meaning, facts, or intent**. Polish refines the surface; it never
rewrites the substance.

This is the light companion to [`distill`](../distill/SKILL.md). distill
runs an inventory-and-audit loop to guarantee no load-bearing detail is
lost — worth it for plans, runbooks, and agent instructions. polish
skips that ceremony: use it for short prose you can see whole at once,
where clarity, not preservation, is the concern.

## Input detection

- **Text pasted in chat** — output the rewrite in chat. Write nothing to
  disk.
- **File path given** — read it, then propose the change and get
  approval before writing (house rule).
- **Ambiguous** — ask which the user wants.

## Clarity moves

Clarity is the reason this skill exists — concision alone can leave prose
short but still murky. Apply these:

- **Lead with the point.** Main clause first; conclusion before its
  justification. Cut the wind-up.
- **One idea per sentence.** Split a sentence that carries two.
- **Kill ambiguous referents.** Replace an "it", "this", or "they" whose
  antecedent isn't unmistakable with the noun itself.
- **Concrete over vague.** Name the thing rather than gesture at it.
- **Parallel structure.** Cast items in a list or series into the same
  grammatical shape.
- **Order by dependency.** Sequence sentences so each builds on the last;
  group related points.

## Concision

Omit needless words — see
[`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).

## Guardrails

- Preserve meaning, facts, and the author's intent exactly. Never invent
  or "improve" content that isn't there.
- Keep exact tokens verbatim — paths, identifiers, commands, values,
  quoted text.
- Preserve the author's register and tone; sharpen clarity within it,
  don't flatten a deliberate voice.
- If the passage is already clear and tight, say so and make only minimal
  edits. Don't manufacture changes to look productive.

## Output

Output the rewrite. If you cut or moved anything a reader might miss, add
one line noting what and why — no formal audit (that's distill's job).
