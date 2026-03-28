---
name: critique
description: >-
  Critique a document for logical fallacies and weaknesses.
  Identifies issues and provides actionable fixes. Use when
  the user wants a document reviewed, critiqued, or
  stress-tested for logical soundness.
---

# Critique

Analyze a document for logical fallacies and structural
weaknesses. Every issue must include a recommended fix.

## Process

1. **Prompt for the file:**

   If the user did not provide a file path, ask:

   ```text
   Which file do you want me to critique?
   ```

1. **Read the file** in full.

1. **Analyze for logical fallacies.** Scan for instances of:

   - Straw man — misrepresenting a position to attack it
   - False dichotomy — presenting only two options when more
     exist
   - Appeal to authority — claiming truth because an authority
     said so, without evidence
   - Slippery slope — asserting an unlikely chain of
     consequences without justification
   - Circular reasoning — using the conclusion as a premise
   - Ad hominem — attacking the person instead of the argument
   - Red herring — introducing irrelevant points to distract
   - Hasty generalization — drawing broad conclusions from
     limited evidence
   - False cause — assuming correlation implies causation
   - Moving the goalposts — changing criteria after the fact
   - Equivocation — using a term with shifting meaning
   - Appeal to emotion — substituting emotional persuasion
     for evidence
   - Bandwagon — arguing something is true because many
     believe it
   - Begging the question — assuming the conclusion within the
     premise
   - Tu quoque — deflecting criticism by pointing to the
     accuser's behavior

   This is not exhaustive. Flag any fallacy you identify, even
   if it is not listed here.

1. **Critique the document.** Evaluate:

   - **Argument structure** — Are claims supported? Are there
     gaps in reasoning? Do conclusions follow from premises?
   - **Evidence quality** — Are sources cited? Is evidence
     relevant and sufficient? Are statistics used correctly?
   - **Assumptions** — What unstated assumptions exist? Are
     they reasonable?
   - **Completeness** — Are counterarguments addressed? Are
     important perspectives missing?
   - **Clarity** — Are terms defined? Is the writing ambiguous
     or vague where precision matters?
   - **Consistency** — Does the document contradict itself?
     Do later sections conflict with earlier claims?

## Output

Present findings in two sections. For every issue, quote the
relevant passage and provide a concrete fix.

### Logical Fallacies

For each fallacy found:

```text
**{Fallacy Name}**

> {Quoted passage from the document}

Problem: {Why this is a fallacy — one or two sentences.}

Fix: {Specific rewrite or approach to eliminate the fallacy.}
```

If no fallacies are found, state that explicitly.

### Document Weaknesses

For each weakness found:

```text
**{Category}** — {Brief title}

> {Quoted passage from the document}

Problem: {What is weak and why it matters.}

Fix: {Concrete recommendation — rewrite, add evidence,
restructure, etc.}
```

### Summary

Close with a short summary: how many fallacies were found,
the most significant weaknesses, and the single highest-impact
improvement the author could make.

## Guidelines

- Be thorough but fair. Flag real issues, not stylistic
  preferences.
- Quote the source text so the author can locate each issue.
- Fixes must be actionable — not "make this better" but a
  specific rewrite or concrete next step.
- If the document is well-constructed, say so. Do not
  manufacture issues.
- Do not rewrite the entire document. Focus on the weakest
  points.
