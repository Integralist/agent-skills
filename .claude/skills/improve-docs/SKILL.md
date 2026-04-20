---
name: improve-docs
description: >-
  Improve the writing of a technical document. Applies
  documentation best practices: brevity, eliminating
  assumptions, modularization, visualization, and reducing
  stale code references. Use when the user wants a technical
  document reviewed and rewritten for clarity and quality.
---

# Improve Technical Documentation

Review a technical document and rewrite it to reduce friction
for the reader. Apply the five documentation pillars below and
produce a concrete, improved version of the document.

## Process

1. **Prompt for the file:**

   If the user did not provide a file path, ask:

   ```txt
   Which file do you want me to improve?
   ```

1. **Read the file** in full.

1. **Audit against the five pillars.** For each pillar, note
   every violation found. A violation is a specific passage
   that breaks a pillar rule.

1. **Rewrite the document.** Apply all fixes and produce the
   improved version. Do not just list problems — deliver the
   rewritten document.

1. **Present a change summary.** After the rewrite, list what
   changed and why, organized by pillar.

## The Five Pillars

### 1. Brevity and Professionalism

- Cut wordy explanations. Get to the point.
- Remove filler words, hedging, and unnecessary qualifiers.
- Maintain a neutral-expert voice throughout. Strip out
  frustration, over-enthusiasm, humor that obscures meaning,
  and first-person asides that do not serve the reader.

### 2. Eliminate Assumptions

- Define every term that a reader outside the team might not
  know. Never assume a concept is "common knowledge."
- Add hyperlinks to Wikipedia or official documentation for
  industry terms, protocols, and third-party tools so readers
  of all levels can follow along.

### 3. Focus and Modularize

- If a section is long enough to be its own document, flag it
  for extraction into a separate file.
- Add or improve internal cross-references between related
  documents. Information should be easy to navigate.
- Avoid the "Mega-Doc" trap: one document, one clear purpose.

### 4. Visualize Simply

- Where architecture or workflows are described in prose,
  suggest or add a Mermaid diagram.
- Diagrams must be high-level and clean. Complexity in a
  diagram defeats its purpose.

### 5. Minimize Stale Code References

- Flag inline code blocks that will become outdated as the
  codebase evolves.
- Prefer describing the logic or pointing to source files
  over pasting code snippets.
- If a code example is essential, note the risk of staleness
  and suggest a strategy to keep it current (e.g., a test
  that validates the example).

## Output

### Rewritten Document

Present the full rewritten document. This is the primary
deliverable.

### Change Summary

After the rewrite, list changes grouped by pillar:

```txt
**{Pillar Name}**

- {What changed and why — one line per change.}
```

### Extraction Recommendations

If any sections should be moved to separate files, list them:

```txt
**{Section title}** → {suggested-filename.md}
Reason: {Why this section warrants its own document.}
```

If no extractions are needed, state that explicitly.

## Guidelines

- The rewritten document is the deliverable, not just a list
  of suggestions. Produce the improved text.
- Preserve the author's intent and technical accuracy. Do not
  invent information.
- Do not add code blocks unless the original had them and
  they are essential. Prefer references to source files.
- When adding Mermaid diagrams, ideally keep them under
  15 nodes.
- If the document is already well-written, say so and make
  only minor improvements. Do not manufacture issues.
- The golden rule: never force a reader to "read the code"
  just to understand what a project does.
