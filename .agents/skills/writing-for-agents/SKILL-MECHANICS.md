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

- `trivial` — mechanical jobs: commit, branch, recap, reformat.
- `moderate` — short writing or one contained task: a PR body, a ticket.
- `complex` — building or changing software, debugging, research, planning,
  multi-file work, or interviews driven by short replies.
- `frontier` — work `complex` would fall short on: codebase-wide redesigns,
  very large migrations.

When unsure, choose `complex`.

## Allowed tools

`allowed-tools` pre-approves commands the skill runs routinely, so the user
isn't prompted for each one. Claude Code honours it; other harnesses may not,
so the skill must work without it. List narrow, low-risk commands such as
`Bash(git status:*)`, and leave anything risky to the normal permission prompt.
