---
name: tech-docs
description: >-
  Write or improve technical documentation. Applies
  documentation best practices: brevity, eliminating
  assumptions, modularization, visualization, and reducing
  stale code references. Use when writing new documentation
  from scratch, or editing, or reviewing and rewriting existing documents
  for clarity and quality.
argument-hint: --new <topic> | --improve <file>
---

# Technical Documentation

Write new or improve existing technical documentation. Apply the five pillars
below to reduce reader friction and produce a concrete document.

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
1. Draft, applying all five pillars from the start: clear purpose, defined
   terms, focused sections, diagrams where helpful, source-file references
   instead of pasted code.
1. Present the draft for review.

## The five pillars

### 1. Brevity and professionalism

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

### 2. Eliminate assumptions

- Define every term a reader outside the team might not know. Never assume
  "common knowledge."
- Hyperlink industry terms, protocols, and third-party tools to Wikipedia or
  official docs so readers of all levels can follow.

### 3. Focus and modularize

- If a section is long enough to be its own document, flag it for extraction.
- Add or improve cross-references between related documents.
- Avoid the mega-doc trap: one document, one clear purpose.

### 4. Visualize simply

- Where architecture or workflows are described in prose, suggest or add a
  Mermaid diagram. Diagrams and tables replace prose, not just supplement it —
  delete paragraphs a visual already communicates.
- Use tables for "multiple dimensions × multiple cases" information (e.g.
  environment matrices, permission grids). A table replacing four paragraphs is
  a net win.
- Use indented structured text for linear chains or hierarchies too simple for
  a diagram but too structured for prose.
- Keep diagrams high-level and clean. Complexity defeats the purpose.

### 5. Minimize stale code references

- Flag inline code blocks that will become outdated as the codebase evolves.
- Cut snippets that restate what a diagram, table, or structured-text block
  already shows. Redundancy alone justifies removal — staleness is secondary.
- Prefer describing the logic or pointing to source files over pasting code.
- If a code example is essential, note the staleness risk and suggest a way to
  keep it current (e.g. a test that validates the example).

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
- Do not add code blocks unless the original had them and they are essential.
  Prefer references to source files.
- When adding Mermaid diagrams, ideally keep them under 15 nodes.
- If the document is already well-written, say so and make only minor
  improvements. Do not manufacture issues.
- Golden rule: never force a reader to "read the code" just to understand what a
  project does.
