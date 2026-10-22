---
name: skill-rewrite
description: >-
  Rewrite an existing skill to be short and readable without losing its core
  behaviour. Use when the user asks to rewrite, simplify, or slim down a skill.
metadata:
  model-tier: moderate
---

Rewrite a skill so the user can read it in one pass and change it without fear.
A skill clear to the user is clear to the agent; spell out only what the agent
would otherwise get wrong.

**Inventory.** Read the skill and every file it links to, then grep for every
file that links to it. Draft
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

**Draft.** Write the rewrite following writing-for-agents, show it in full in
chat, and wait for approval.

**Verify.** Compare the written skill and any relocated rules with the settled
keep/drop/move decisions. Each retained behaviour must have a reachable home;
each removal must match an agreed decision.

Done when the user approves the draft, it's written, the decisions hold, and
no file still points at a rule the rewrite removed.
