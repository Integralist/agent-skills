---
name: durable-rules
description: >-
  Turn systemic patterns from an investigation or finished work into
  guardrails, conventions, anti-patterns, or skill changes. Use after a plan
  or piece of work when the user asks what should be codified so it doesn't
  recur.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Surface Durable Rules

After a plan or piece of work, review the findings, recent prompts, and how
the agent behaved for systemic patterns worth codifying beyond this task:
guardrails, coding conventions, anti-patterns, and skill changes. Include
recurring, avoidable context or tool costs, such as repeated reads,
oversized output, or redundant exploration, when a reusable fix exists; one-off
waste isn't a rule, and no token metrics are needed. Project operating
instructions (commands, gotchas) belong to the agents-md skill.

1. **Find candidates.** If nothing durable or automatable surfaced, say so
   and stop. Done when you have a list, or have stopped.
2. **Route each candidate:**
   - **Mechanical** (syntax, banned APIs, file structure): propose a linter
     rule, pre-commit hook, or CI check rather than prose.
   - **Judgment-call convention or anti-pattern:** a project-specific one
     goes in the repo's conventions directory or convention skills, or else
     `.agents/AGENTS.md` through the agents-md skill; a cross-project one
     goes in the global source repo. Update a file that already covers the
     topic before proposing a new one.
   - **Skill behaviour:** extend an existing skill whose scope fits, or
     propose a new skill for a distinct, repeated workflow, written to
     [writing-for-agents](../writing-for-agents/SKILL.md), in the project's
     `.agents/skills/` or the global repo.

   Done when every candidate has a destination.
3. **Confirm, then write.** Show the proposed rules and skills and write only
   after the user confirms. Edit source repos only, never installed copies
   (`~/.agents/`, `~/.claude/`) or files with a "generated" banner, then
   regenerate (`make rules` or `make` in that repo). Done when the approved
   changes are written and regenerated.

**Global source repo.** Global skills and conventions live in
`https://github.com/Integralist/agent-skills`. To find its local clone,
check `~/code/agent-skills`, `~/src/agent-skills`, `~/projects/agent-skills`,
and `~/dev/agent-skills`; then `readlink ~/.claude/skills` or
`readlink ~/.agents/skills`; then
`find ~/code ~/src ~/projects -maxdepth 3 -type d -name agent-skills`,
confirming with `git -C <path> remote get-url origin`. If it's still missing,
ask the user for the path.
