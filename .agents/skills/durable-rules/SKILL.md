---
name: durable-rules
description: >-
  Surface systemic patterns from an investigation as codified
  conventions, anti-patterns, or skill improvements.
disable-model-invocation: true
---

# Surface Durable Rules

After producing a plan or completing work, review findings, recent prompts,
and interaction behaviours for **systemic patterns** that should be codified
beyond the specific task.

Scope covers coding conventions, anti-patterns, and skill automation.
Project operating instructions (build/test/lint commands, gotchas) belong
to [`agents-md`](../agents-md/SKILL.md).

## Workflow

1. If nothing durable or automatable surfaced, skip entirely. Do not force it.
2. Classify each candidate:
   - **Coding convention or anti-pattern**:
     - *Project-specific* → repo's conventions dir or convention skills if
       present; otherwise `.agents/AGENTS.md` via `agents-md`.
     - *Cross-project* → global conventions source (see "Locating global
       source repo").
     - Update an existing file that covers the topic, or propose a new one.
   - **Prompt or behaviour for skills**:
     - *Existing skill* → if the behaviour fits an existing skill's scope,
       propose updating its `SKILL.md` (e.g. adding steps or edge cases).
     - *New skill* → if a prompt pattern or workflow is repeated and distinct,
       propose a new skill (`SKILL.md` with frontmatter, workflow, and bounds
       following [`writing-for-agents`](../writing-for-agents/SKILL.md)).
     - *Scope* → target local project (`.agents/skills/`) or global
       (see "Locating global source repo").
3. **Never edit installed copies or generated files.** Do not edit
   `~/.agents/`, `~/.claude/`, or files with a "generated" banner directly.
   Always edit in the source git repository and regenerate.
4. **Present proposed rules and skills to the user for confirmation before
   writing.**
5. Only write after the user confirms.

## Locating global source repo

Global skills and conventions live in
`https://github.com/Integralist/agent-skills`. When editing global skills or
global `AGENTS.md`, locate its local clone on the machine:

1. Check common clone paths: `~/code/agent-skills`, `~/src/agent-skills`,
   `~/projects/agent-skills`, or `~/dev/agent-skills`.
2. Inspect symlinks: check `readlink ~/.claude/skills` or
   `readlink ~/.agents/skills` to resolve the source directory.
3. Search workspace roots: run
   `find ~/code ~/src ~/projects -maxdepth 3 -type d -name "agent-skills"`
   and verify with `git -C <path> remote get-url origin`.
4. If still not found, ask the user for the local repo path.

Make edits inside the discovered repo (e.g. `.agents/skills/<skill>/SKILL.md`
or `AGENTS.md`), then run `make rules` or `make` in that repo to regenerate
derived assets.
