---
name: critique
description: >-
  Critique a document for logical fallacies and weaknesses, with a fix for each
  issue. Use when reviewing a plan, proposal, or other document before acting
  on it.
disable-model-invocation: true
metadata:
  model-tier: moderate
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
   - Clarity: undefined terms or vagueness where precision matters.
   - Consistency: contradictions or later sections that conflict with earlier
     ones.
   - Terminology: flag glossary conflicts or avoided alternatives only when
     they create ambiguity or change meaning; ignore harmless style variation.
4. **For plans only, check execution quality.** Apply this to implementation
   plans or task lists, including `plan.md` or `tasks.md` under `projects/`,
   and documents built from slices, milestones, tasks, and a File Changes
table. Skip it for blog posts, research, and design notes. Check:
   - Scope drift into unnecessary refactors, renames, or cleanup.
   - Required files missing from the File Changes table.
   - Tasks or milestones without pass/fail signals, such as "improve X" or
     "clean up Y".
   - Uncheckable milestones or `**Verify:**` lines without a command and
     expected output.
   - Dependencies on another slice's task, file, type, or contract that are
     absent from Blocked by, Consumes, or Produces.
   - Missing error paths, partial failures, concurrent callers, rollback, or
     existing-data migration cases.
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
