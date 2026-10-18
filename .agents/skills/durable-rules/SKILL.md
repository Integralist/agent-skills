---
name: durable-rules
description: >-
  Turn friction from a coding session, or patterns from finished work, into
  checks, conventions, instruction changes, or skill changes so they don't
  recur. Use when a session ran slow, hit repeated errors, or had tool or
  context friction; when the user asks what should be codified so it
  doesn't happen again; or at the end of a plan or piece of work.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Durable Rules

Review a coding session or a finished piece of work for friction and
systemic patterns, and propose durable changes so they don't recur: checks,
conventions, instruction-file changes, and skill changes. A one-off mistake
or one-off waste isn't a rule. Follow
[writing-for-agents](../writing-for-agents/SKILL.md) for any instruction text
you propose.

1. **Read the source.** Run on its own, read the session's transcript or
   logs on this machine, defaulting to the current session. Called at the end
   of another skill, use that work's findings, the recent prompts, and how
   the agent behaved. Done when you've read it end to end.
2. **Find candidates** in each category:
   - **Automated checks:** errors a check could have caught. Read the repo's
     build and check commands first (`package.json`, `Makefile`, CI). A
     check that exists but is unwired or broken is the top finding, and a
     repo with no pre-commit hook or CI running lint, typecheck, and test is
     a standing one.
   - **Conventions and anti-patterns:** judgement calls the agent got wrong,
     or a reviewer had to catch.
   - **Navigation:** files that took many tool calls to find.
   - **Context and tool costs:** recurring repeated reads, broad greps,
     oversized output, or redundant exploration with a reusable fix (no
     token metrics needed), and always-loaded instructions that don't change
     behaviour.
   - **Information access:** missing feeds that forced guessing, such as dev
     server logs or read-only third-party access.
   - **Skill behaviour:** a skill that misfired, or a repeated workflow that
     has no skill.

   If nothing durable surfaced, say so and stop. Done when each category has
   candidates or is clear.
3. **Route each candidate** using **Where things go**, updating a file that
   already covers the topic before proposing a new one. Done when every
   candidate has a destination.
4. **Confirm, then write.** Show the proposals ranked by severity, each with
   its destination, and write only after the user confirms. Edit source repos
   only, never installed copies (`~/.agents/`, `~/.claude/`) or files with a
   "generated" banner, then regenerate (`make rules` or `make` in that repo).
   Done when the approved changes are written and regenerated.

**Where things go.** Implementation runs under high context pressure, so
keep always-loaded steering short; review sees a diff and little else, so
detailed standards belong there.

- **Mechanical rules** (syntax, banned APIs, import shape, file paths): a
  linter rule, pre-commit hook, or CI check rather than prose.
- **`AGENTS.md`:** loaded every session, so only what the agents-md skill's
  rubric allows: why the project exists, where things are, how to build,
  test, and lint, and the gotchas and conventions the code doesn't reveal,
  in under ~200 lines. Make the change through the agents-md skill.
- **Longer standards checked at review:** the repo's conventions directory,
  `CODING_STANDARDS.md` (with navigation pointers once it passes ~1,000
  lines), or convention skills, with a pointer from `AGENTS.md`.
- **`docs/`:** reference loaded on demand through pointers.
- **Skills:** extend one whose scope fits, or propose a new one for a
  distinct, repeated workflow, in the project's `.agents/skills/`.
- **Anything cross-project:** the global source repo.

**Global source repo.** Global skills and conventions live in
`https://github.com/Integralist/agent-skills`. To find its local clone,
check `~/code/agent-skills`, `~/src/agent-skills`, `~/projects/agent-skills`,
and `~/dev/agent-skills`; then `readlink ~/.claude/skills` or
`readlink ~/.agents/skills`; then
`find ~/code ~/src ~/projects -maxdepth 3 -type d -name agent-skills`,
confirming with `git -C <path> remote get-url origin`. If it's still missing,
ask the user for the path.
