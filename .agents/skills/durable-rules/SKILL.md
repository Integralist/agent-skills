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
  model-tier: moderate
---

Look for recurring friction and systemic patterns in a coding session or
finished work. Propose durable fixes—checks, conventions, instruction changes,
or skill changes. A one-off mistake or waste is not a rule. Follow
[writing-for-agents](../writing-for-agents/SKILL.md) for any instruction text
you propose.

## Workflow

1. **Read the source.** When run alone, read the session transcript or logs on
   this machine, defaulting to the current session. When called at the end of
   another skill, use its findings, recent prompts, and the agent's behaviour.
   Read the source end to end.
2. **Find candidates in every category.** If nothing durable surfaced, say so
   and stop.
   - **Automated checks:** Read the repo's build and check commands first
     (`package.json`, `Makefile`, CI). An existing but unwired or broken check
     is the top finding. A repo without pre-commit or CI checks for lint,
     typecheck, and tests has a standing finding.
   - **Conventions and anti-patterns:** Judgement calls the agent got wrong or
     a reviewer had to catch.
   - **Navigation:** Files that took many tool calls to find.
   - **Context and tool costs:** Repeated reads, broad greps, oversized output,
     redundant exploration with a reusable fix, and always-loaded instructions
     that do not change behaviour. Token metrics are not needed.
   - **Information access:** Missing feeds that forced guessing, such as dev
     server logs or read-only third-party access.
   - **Skill behaviour:** A skill that misfired or a repeated workflow with no
     skill.
3. **Choose a destination.** Route every candidate using **Where things go**
   below. Update an existing file that covers the topic before proposing a
   new one.
4. **Confirm before writing.** Present proposals ranked by severity, with a
   destination for each. Write only after the user confirms. Edit source repos
   only—never installed copies (`~/.agents/`, `~/.claude/`) or files with a
   `generated` banner. Then regenerate with `make rules` or `make` in that
   repo.

## Where things go

Keep always-loaded steering short: implementation runs under high context
pressure, while review sees a diff and little else. Put detailed standards
where they are checked.

- **Mechanical rules** (syntax, banned APIs, import shape, file paths): linter,
  pre-commit hook, or CI check.
- **`AGENTS.md`:** Only what the agents-md skill's rubric allows: why the
  project exists, where things are, how to build, test, and lint, plus gotchas
  and conventions the code does not reveal. Keep it under about 200 lines and
  make changes through the agents-md skill.
- **Longer standards checked at review:** the repo's conventions directory,
  `CODING_STANDARDS.md` (add navigation pointers after about 1,000 lines), or
  convention skills, with a pointer from `AGENTS.md`.
- **`docs/`:** References loaded on demand through pointers.
- **Skills:** Extend one whose scope fits, or propose a skill for a distinct,
  repeated workflow, in the project's `.agents/skills/`.
- **Cross-project rules:** Put them in the global source repo.

## Global source repo

Global skills and conventions live in
`https://github.com/Integralist/agent-skills`. Find its local clone by checking
these paths:

1. `~/code/agent-skills`, `~/src/agent-skills`, `~/projects/agent-skills`,
   and `~/dev/agent-skills`.
2. `readlink ~/.claude/skills` or `readlink ~/.agents/skills`.
3. `find ~/code ~/src ~/projects -maxdepth 3 -type d -name agent-skills`.

Confirm the clone with `git -C <path> remote get-url origin`. If it is still
missing, ask the user for its path.
