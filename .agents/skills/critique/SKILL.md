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

# Critique

Find the logical fallacies and structural weaknesses in a document, quote each
one, and give a concrete fix. Flag real issues, not style preferences; if the
document is sound, say so rather than manufacturing problems.

1. **Read the file.** Use the path the user gave; if none, ask which file to
   critique. Read it in full. Done when you've read the whole file.

2. **Scan for fallacies.** Flag any you spot, listed or not: straw man, false
   dichotomy, appeal to authority, slippery slope, circular reasoning, ad
   hominem, red herring, hasty generalization, false cause, moving the
   goalposts, equivocation, appeal to emotion, bandwagon, begging the
   question, tu quoque. Done when every fallacy found is quoted.

3. **Check the document.** Look for weaknesses in:
   - **Argument structure:** unsupported claims, gaps, conclusions that don't
     follow.
   - **Evidence:** missing sources, irrelevant or thin evidence, misused
     statistics.
   - **Assumptions:** unstated ones, and whether they're reasonable.
   - **Completeness:** counterarguments or perspectives left out.
   - **Clarity:** undefined terms, vagueness where precision matters.
   - **Consistency:** contradictions, later sections conflicting with earlier
     ones.

   Done when each category is checked.

4. **Check plans too.** If the document is an implementation plan or task
   list (`plan.md` or `tasks.md` under `projects/`, or built from slices,
   milestones, tasks, and a File Changes table), also check:
   - **Scope:** tasks that drift into refactors, renames, or cleanup the goal
     doesn't need.
   - **File Changes:** files the tasks must touch that the table doesn't list.
   - **Testability:** tasks or milestones with no pass/fail signal, such as
     "improve X" or "clean up Y".
   - **Verification:** milestones that aren't checkable, or `**Verify:**`
     lines without an actual command and expected output.
   - **Dependencies:** a slice or task that needs another's file, type, or
     contract without saying so in Blocked by, Consumes, or Produces.
   - **Edge cases:** error paths, partial failures, concurrent callers,
     rollback, and migrating existing data.

   Skip this step for anything that isn't a plan, such as a blog post,
   research doc, or design note. Done when each check is done or skipped.

5. **Report.** Write two sections, Logical Fallacies and Document Weaknesses,
   with one entry per issue; if there are no fallacies, say so. Focus on the
   weakest points rather than rewriting the document. Make each fix a
   specific rewrite or next step, not "make this better":

   ```txt
   **{Fallacy name, or Category — brief title}**

   > {Quoted passage}

   Problem: {Why it's a fallacy or weakness, and why it matters.}

   Fix: {Specific rewrite or concrete next step.}
   ```

   End with a summary: how many fallacies you found, the most significant
   weaknesses, and the single highest-impact improvement. Done when every
   issue has a quote and a fix, and the summary is written.
