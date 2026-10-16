---
name: skill-rewrite
description: >-
  Rewrite an existing skill to be short and readable without losing its core
  behaviour. Use when the user asks to rewrite, simplify, or slim down a skill.
metadata:
  model-tier: complex
---

Rewrite a skill so the user can read it in one pass and change it without fear.
A skill clear to the user is clear to the agent; spell out only what the agent
would otherwise get wrong. Read [writing-for-agents](../writing-for-agents/SKILL.md)
for the underlying levers.

**Inventory.** Read the skill and grep for every file that links to it. Draft
your own list of its core pieces — what it must do, what it must never do — but
keep it to yourself. Ask the user for their list first, so yours doesn't anchor
them.

**Compare.** Show where the lists agree, then a table of pieces only one list
had, each with keep, drop, or move and your reason. Ask only about the
decisions; settle facts yourself. When a rule exists to guard against a past
failure, test whether the failure still happens before keeping or dropping it.

**Move, don't merge.** Logic that serves another workflow (a planner's
lifecycle, a coordinator's bookkeeping) belongs in that workflow or a shared
doc. Before moving it, check the destination hasn't already decided against
owning it. Repoint every file that linked to the old home.

**Draft.** Show the full rewrite in chat and wait for approval. Write it in
this shape:

- The first paragraph says what the skill does in total — it is the summary.
- Then short paragraphs, each led by a bold label and doing one job.
- One default path per decision; name the exception only where one exists.
- Each rule once. Give the reason inline only where it changes behaviour.
- One template in a code block for any output; one BAD/GOOD pair if the rule
  is subtle.
- Detail that only some runs need lives behind a link.

**Keep it fast.** Every file load and command slows the skill. Inline small,
stable facts (an allowed-types list) instead of reading a config; let hooks
and the environment enforce what they already enforce.

**Keep it portable.** Name other skills in plain words ("use the branch
skill"), never as a slash command. Avoid syntax only some harnesses run, such
as pre-run command lines; tell the agent which commands to run instead.

Done when the user approves the draft, it's written, and no file still points
at a rule the rewrite removed.
