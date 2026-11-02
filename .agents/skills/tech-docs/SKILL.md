---
name: tech-docs
description: >-
  Write or improve technical documentation. Use when writing a new document
  from scratch, or when editing, reviewing, or rewriting an existing one for
  clarity and quality.
argument-hint: --new <topic> | --improve <file>
metadata:
  model-tier: moderate
---

Write or improve short, accurate technical documents that explain why and
what, not how, and resist code rot. Deliver the document, not suggestions;
preserve the author's intent and accuracy, and invent nothing.

Follow [conventions-markdown](../conventions-markdown/SKILL.md) (including
link rules) and [voice-product](../voice-product/SKILL.md) for overviews,
rationale, and user impact. Before auditing or drafting, read
[PILLARS.md](references/PILLARS.md). Use distill for long prose that needs
condensing without losing load-bearing details.

**Mode:** `--new <topic>` writes a document; `--improve <file>` rewrites one.
With neither flag, infer the mode from context and ask if it remains unclear.

## Improve an existing document

1. Read the whole file; ask which file if none was given.
2. Audit it against all five pillars, noting every passage that breaks one. If
   it is already well written, say so and make only small fixes.
3. Rewrite it, applying every fix, then deliver the full rewritten document.
4. Summarize the changes by pillar and give extraction recommendations, or
   say none are needed.

For similar documents, use a verified-pattern fan-out from the
[shared subagent policy](../shared/SUBAGENT-STEERABILITY.md): rewrite one,
then wait for approval before subagents apply it to the rest. Follow its
completion and retry protocol.

## Write a new document

Confirm the topic, audience, and purpose with the user. Draft the document
with the five pillars applied from the start, then present the draft for
review.

## Improve-mode output

For an improvement, return the full rewrite, then changes grouped by pillar
and extraction recommendations (or say none are needed):

```md
**{Pillar name}**

- {What changed and why, one line per change.}

**{Section title}** → {suggested-filename.md}
Reason: {why this section warrants its own document.}
```
