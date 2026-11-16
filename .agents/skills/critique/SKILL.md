---
name: critique
description: >-
  Critique a document for logical fallacies and weaknesses, with a fix for each
  issue. Use when reviewing a plan, proposal, or other document before acting
  on it.
disable-model-invocation: true
metadata:
  model-tier: complex
---

Critique a document for logical fallacies and structural weaknesses. Quote each
real issue and give a concrete fix; do not report style preferences or invent
problems. If the document is sound, say so.

## Workflow

1. **Read the whole document.** Use the path the user gave. If they gave none,
   ask which file to critique. For project documents, also read root
   `GLOSSARY.md`; if absent, use root `CONTEXT.md` as the legacy glossary.
2. **Check for fallacies.** Look for straw man, false dichotomy, appeal to
   authority, slippery slope, circular reasoning, ad hominem, red herring,
   hasty generalization, false cause, moving the goalposts, equivocation,
   appeal to emotion, bandwagon, begging the question, and tu quoque. Also
   flag other fallacies you find.
3. **Check the argument.** Check every category:
   - Argument structure: unsupported claims, gaps, or conclusions that do not
     follow.
   - Evidence: missing sources, irrelevant or thin evidence, misused
     statistics.
   - Assumptions: what is unstated and whether it is reasonable.
   - Completeness: missing counterarguments or perspectives.
   - Clarity: undefined terms, unexplained lettered IDs or shorthand before
     first use, or vagueness where precision matters.
   - Consistency: contradictions or later sections that conflict with earlier
     ones.
   - Terminology: flag glossary conflicts or avoided alternatives only when
     they create ambiguity or change meaning; ignore harmless style variation.
4. **Apply artifact-specific checks when relevant.** Skip this step for blog
   posts, research, PDD drafts, and design notes.
   - **Plans and task lists** (`plan.md`, `tasks*.md`, or documents built from
     slices, milestones, and a File Changes table): read and follow
     [the plan checklist](references/PLAN-CHECKLIST.md).
   - **Specs and Gherkin** (`spec.md`, `*.feature`, or work involving
     acceptance criteria or `docs/specs/`): read and follow
     [the spec checklist](references/SPEC-CHECKLIST.md).
5. **Report the findings.** Write two sections: **Logical Fallacies** and
   **Document Weaknesses**. Include one entry per issue. If there are no
   fallacies, say so. Focus on the weakest points; critique rather than
   rewriting the document.

Use this format for every issue:

```txt
**{Fallacy name, or Category — brief title}**

> {Quoted passage}

Problem: {Why it is a fallacy or weakness, and why it matters.}

Fix: {Specific rewrite or concrete next step.}
```

End with a summary: the number of fallacies, the most significant weaknesses,
and the single highest-impact improvement. Every issue needs a quote and a
fix.
