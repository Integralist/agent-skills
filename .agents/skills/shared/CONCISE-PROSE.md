# Omit Needless Words

Shared principle for skills whose human-readable deliverable is prose: docs,
PR/commit messages, changelogs, plans, research, summaries, handoffs, and
ADR/PRD text.

Use the shortest complete explanation, not the fewest words. State the point;
cut filler, repetition and qualifiers that add no meaning. Prefer familiar
words, active verbs and concrete actors over compressed jargon or acronyms.

- Keep each obligation in one clear place; link rather than repeat it.
- Explain a necessary term once, then use it consistently. No banned-word list
  or sentence-length quota can decide whether a term is needed.
- Preserve paths, flags, permissions, timing, ownership, edge cases and
  uncertainty. If a shorter version needs more explanation, it is not clearer.
- Separate a summary from supporting history/detail. Collapsing text improves
  navigation, not word count. Never move a requirement out of its durable home
  just to make a document look shorter.

For reader-facing specs and plans, prefer a clear standalone paragraph followed
by `<details>` with a descriptive `<summary>` for useful supporting detail.
Keep scope, consequential choices, open risks, acceptance criteria and slice
contracts visible. Exact schemas, error tables and supporting rationale may
be expandable detail in their owning artifact; reviewers read that detail too.
Use blank lines around the Markdown inside the dropdown so it renders.
