---
name: tech-docs
description: >-
  Write or improve technical documentation. Applies documentation best
  practices: brevity, focusing on why and what rather than how, simple
  visualizations, modularization, and decoupling from volatile code. Use when
  writing new documentation from scratch, or editing, or reviewing and rewriting
  existing documents for clarity and quality.
argument-hint: --new <topic> | --improve <file>
---

# Technical Documentation

Write new or improve existing technical documentation. Apply the five pillars
below to reduce reader friction, prevent documentation rot, and produce a
concrete document.

## Mode selection

- `--new <topic>` — write a new document from scratch.
- `--improve <file>` — review and rewrite an existing document.

If neither flag is given, infer from context. If still ambiguous, ask.

## Process

**Improving (`--improve`):**

1. If no file path was given, ask: `Which file do you want me to improve?`
1. Read the file in full.
1. Audit against the five pillars, noting every violation (a specific passage
   that breaks a pillar rule).
1. Rewrite the document, applying all fixes. Deliver the rewritten document —
   don't just list problems.
1. Present a change summary, organized by pillar.

For a *set* of docs sharing the same problems, this is a
[verified-pattern fan-out](../shared/SUBAGENT-STEERABILITY.md): rewrite **one**
and present its change summary; once the user approves the pillar-transform, fan
out subagents to apply the same transform to the siblings. Single-doc
improvement stays inline.

**Writing (`--new`):**

1. Clarify scope — confirm topic, audience, and purpose with the user.
1. Draft, applying all five pillars from the start: clear purpose, focus on
   "why" and "what", simple diagrams for flow, no volatile code references.
1. Present the draft for review.

## The five pillars

### 1. Brevity and high signal

- Omit needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md). Write the point,
  then cut anything that survives removal without loss of meaning.
- Maintain a neutral-expert voice. Strip frustration, over-enthusiasm, humor
  that obscures meaning, and first-person asides that don't serve the reader.
- Evaluate at the section level, not just the sentence: is this section earning
  its length? If a diagram or table already says it, cut the prose that
  restates it.
- Kill historical/legacy sections that serve no current reader — that context
  belongs in git history or a linked ADR, not an active reference doc.
- For aggressive condensing of long prose where every load-bearing detail must
  survive, use [`distill`](../distill/SKILL.md).

### 2. Focus on "why" and "what", not "how"

- Document intent, domain models, constraints, trade-offs, and architectural
  boundaries.
- Leave internal implementation mechanics to the code and tests — the codebase
  is the only reliable source of truth for "how".
- Avoid step-by-step code walkthroughs in prose. If interaction flow or
  lifecycle must be explained, use a simple diagram or protocol contract.

### 3. Visualize simply

- Where architecture, workflows, or lifecycles are described, use simple
  Mermaid diagrams (ideally <= 15 nodes). Diagrams replace prose — delete
  paragraphs a visual already communicates.
- Use tables for "multiple dimensions × multiple cases" information (e.g.
  environment matrices, permission grids). A table replacing four paragraphs is
  a net win.
- Use indented structured text for linear chains or hierarchies too simple for
  a diagram but too structured for prose.
- Keep diagrams high-level and clean. Complexity defeats the purpose.

### 4. Decouple from volatile code

- Eliminate references to volatile code artifacts: no file paths, line numbers,
  private functions/classes, internal variable names, or pasted code blocks.
- Reference only stable, high-level domain terms and public architectural
  boundaries.
- When an example is strictly necessary, provide a generic, illustrative schema
  or contract rather than live source snippets that rot on refactor.

### 5. Focus and modularize

- If a section is long enough to be its own document, flag it for extraction.
- Add or improve cross-references between related documents.
- Avoid the mega-doc trap: one document, one clear purpose.
- Define terms a reader outside the team might not know, but avoid explaining
  standard industry concepts in long prose.

## Output

**Rewritten document** — the full rewritten document, the primary deliverable.

**Change summary** — after the rewrite, list changes grouped by pillar:

```txt
**{Pillar Name}**

- {What changed and why — one line per change.}
```

**Extraction recommendations** — if any sections should move to separate
files, list them; otherwise state explicitly that none are needed:

```txt
**{Section title}** → {suggested-filename.md}
Reason: {Why this section warrants its own document.}
```

## Guidelines

- The rewritten document is the deliverable, not a list of suggestions. Produce
  the improved text.
- Preserve the author's intent and technical accuracy. Do not invent
  information.
- Do not paste code blocks or point to fragile source locations. Rely on
  domain concepts and simple diagrams.
- Keep Mermaid diagrams under 15 nodes.
- If the document is already well-written, say so and make only minor
  improvements. Do not manufacture issues.
