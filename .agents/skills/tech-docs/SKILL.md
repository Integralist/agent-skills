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

# Technical Documentation

Write new technical documents or rewrite existing ones so they're short,
explain why and what rather than how, and don't rot when the code changes.
The deliverable is the document itself, not a list of suggestions. Keep the
author's intent and technical accuracy, and invent nothing. Follow
[conventions-markdown](../conventions-markdown/SKILL.md), including its link
rules, and [voice-product](../voice-product/SKILL.md) for the overview,
rationale, and user impact.

**Mode.** `--new <topic>` writes a document; `--improve <file>` rewrites one.
With neither flag, infer from context and ask if it's still unclear.

## Improving a document

1. **Read the whole file,** asking which file if none was given. Done when
   you've read it end to end.
2. **Audit it against the five pillars,** noting each passage that breaks
   one. If it's already well written, say so and make only small fixes. Done
   when every violation is listed.
3. **Rewrite it,** applying every fix. Done when the full rewritten document
   is delivered.
4. **Summarise the changes** in the output below. Done when the summary and
   extraction recommendations follow the rewrite.

For a set of documents with the same problems, use a
[verified-pattern fan-out](../shared/SUBAGENT-STEERABILITY.md): rewrite one,
and once the user approves its changes, have subagents apply the same changes
to the rest, following the shared completion and retry protocol.

## Writing a document

1. **Confirm the topic, audience, and purpose** with the user. Done when all
   three are agreed.
2. **Draft it** with the five pillars applied from the start. Done when the
   draft is presented for review.

## The five pillars

**1. Brevity.** Omit needless words, following
[CONCISE-PROSE.md](../shared/CONCISE-PROSE.md), and judge each section as well
as each sentence: cut prose that a table or diagram already says, and cut
history no current reader needs, which belongs in git or a linked ADR. Keep a
neutral, expert voice, without frustration, hype, or asides. Emoji appear only
as status cells in a table (✅ ❌); GitHub callouts render their own icons. To
condense long prose without losing a load-bearing detail, use the distill
skill.

**2. Why and what, not how.** Document intent, domain models, constraints,
trade-offs, and boundaries. Leave implementation mechanics to the code and
tests, the only reliable record of how; explain a flow or lifecycle with a
diagram or contract rather than a code walkthrough.

**3. Visualise simply.** Use a Mermaid diagram of 15 nodes or fewer for
architecture, workflows, and lifecycles, following
[conventions-mermaid](../conventions-mermaid/SKILL.md), and delete the
paragraphs it replaces. Use a table for many dimensions across many cases,
such as environment matrices or permission grids, and indented text for a
chain or hierarchy too simple to diagram.

**4. Decouple from volatile code.** Leave out file paths, line numbers,
private functions and classes, internal variable names, and pasted source,
which rot on the next refactor. Refer to stable domain terms and public
boundaries, and when an example is essential, give a generic schema or
contract.

**5. One document, one purpose.** Flag a section long enough to stand alone
for extraction, add cross-references between related documents, and define
terms an outsider wouldn't know without explaining standard industry
concepts at length.

## Output

The full rewritten document comes first, then the change summary grouped by
pillar, then extraction recommendations, or a line saying none are needed:

```md
**{Pillar name}**

- {What changed and why, one line per change.}

**{Section title}** → {suggested-filename.md}
Reason: {why this section warrants its own document.}
```
