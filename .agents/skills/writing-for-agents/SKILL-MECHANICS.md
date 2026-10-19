# Skill mechanics

Frontmatter choices that only apply when the document is a skill.

## Invocation

Default to user-invoked: set `disable-model-invocation: true` and write a
one-line, human-facing `description`. It costs no context, but only the user
can start it.

Make a skill model-invoked (omit the flag) only when the agent must start it on
its own or another skill must reach it. Its description then stays loaded every
turn, so write it as a trigger (see "Be concrete" in [SKILL.md](SKILL.md)).
Split part of a skill into its own model-invoked skill only when that part needs
its own trigger.

## Model tier

Every skill declares `metadata.model-tier`, so a model-picking harness switches
to the right model and effort when the skill runs:

```yaml
metadata:
  model-tier: complex
```

Pick the tier from the hardest work the skill does, not its length:

- `trivial` — mechanical jobs and short writing: commit, branch, recap,
  reformat, a PR body, a ticket.
- `moderate` — building or changing software, debugging, multi-file work.
- `complex` — project planning and big-picture thinking: specs, plans,
  research, architecture, design decisions, domain modelling, code or security review,
  and interviews driven by short replies, such as grilling.
- `frontier` — thinking `complex` would fall short on: redesigning a whole
  codebase or system, or planning a very large migration.

When unsure, choose `moderate`.

## Allowed tools

`allowed-tools` pre-approves commands the skill runs routinely, so the user
isn't prompted for each one. Claude Code honours it; other harnesses may not,
so the skill must work without it. List narrow, low-risk commands such as
`Bash(git status:*)`, and leave anything risky to the normal permission prompt.
