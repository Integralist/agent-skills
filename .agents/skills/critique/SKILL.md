---
name: critique
description: >-
  Critique a document for logical fallacies and weaknesses.
  Identifies issues and provides actionable fixes.
disable-model-invocation: true
---

# Critique

Analyze a document for logical fallacies and structural weaknesses. Every issue
must include a recommended fix.

## Process

1. **Get the file.** If no path was given, ask:

   ```txt
   Which file do you want me to critique?
   ```

1. **Read the file** in full.

1. **Scan for logical fallacies.** Not exhaustive — flag any fallacy you spot,
   listed or not:

   - Straw man — misrepresenting a position to attack it
   - False dichotomy — only two options when more exist
   - Appeal to authority — true because an authority said so, no evidence
   - Slippery slope — unlikely chain of consequences, unjustified
   - Circular reasoning — conclusion used as a premise
   - Ad hominem — attacking the person, not the argument
   - Red herring — irrelevant points to distract
   - Hasty generalization — broad conclusion from limited evidence
   - False cause — correlation treated as causation
   - Moving the goalposts — changing criteria after the fact
   - Equivocation — a term with shifting meaning
   - Appeal to emotion — emotion substituted for evidence
   - Bandwagon — true because many believe it
   - Begging the question — conclusion assumed in the premise
   - Tu quoque — deflecting criticism onto the accuser's behavior

1. **Critique the document.** Evaluate:

   - **Argument structure** — claims supported? gaps in reasoning? conclusions
     follow from premises?
   - **Evidence quality** — sources cited? evidence relevant and sufficient?
     statistics used correctly?
   - **Assumptions** — what unstated assumptions exist? reasonable?
   - **Completeness** — counterarguments addressed? important perspectives
     missing?
   - **Clarity** — terms defined? ambiguous or vague where precision matters?
   - **Consistency** — self-contradiction? later sections conflict with earlier
     claims?

1. **If the document is an implementation plan** (e.g. under `docs/plans/`, or
   structured with tasks, File Changes, and Verification sections),
   additionally evaluate:

   - **Scope integrity** — is every task within the stated goal, or do some
     drift into adjacent refactors, renames, or cleanup the objective doesn't
     require?
   - **File enumeration** — does the File Changes table list every file the
     tasks imply touching? Flag tasks whose implementation needs unlisted files.
   - **Task testability** — is each task independently verifiable? Flag "improve
     X" / "clean up Y" / "refactor Z" tasks with no pass/fail signal.
   - **Verification concreteness** — does the verification phase name actual
     commands, test paths, or observable outcomes? Flag vague "run the tests" or
     "confirm it works".
   - **Unstated dependencies** — tasks implicitly depending on another (shared
     file, new type, upstream contract) without declaring it?
   - **Edge cases** — unaddressed failure modes: error paths, partial failures,
     concurrent callers, rollback, data migration of existing state.

   These checks apply only to plans. Do not manufacture plan issues on
   non-plans (blog posts, research docs, design notes).

## Output

Two sections plus a summary. For every issue, quote the passage and give a
concrete fix.

### Logical Fallacies

Per fallacy (if none, say so explicitly):

```txt
**{Fallacy Name}**

> {Quoted passage}

Problem: {Why it's a fallacy — one or two sentences.}

Fix: {Specific rewrite or approach to eliminate it.}
```

### Document Weaknesses

Per weakness:

```txt
**{Category}** — {Brief title}

> {Quoted passage}

Problem: {What is weak and why it matters.}

Fix: {Concrete recommendation — rewrite, add evidence, restructure, etc.}
```

### Summary

Close with: how many fallacies were found, the most significant weaknesses, and
the single highest-impact improvement the author could make.

## Guidelines

- Be thorough but fair. Flag real issues, not stylistic preferences.
- Quote the source so the author can locate each issue.
- Fixes must be actionable — a specific rewrite or concrete next step, not "make
  this better".
- If the document is well-constructed, say so. Don't manufacture issues.
- Don't rewrite the whole document. Focus on the weakest points.
