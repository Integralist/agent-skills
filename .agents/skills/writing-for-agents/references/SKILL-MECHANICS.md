# Skill mechanics

Frontmatter controls skill discovery and harness configuration. Behaviour the
agent must follow belongs in the body or an explicitly required reference;
metadata is not a substitute for instructions.

## Invocation

Default to user-invoked: set `disable-model-invocation: true` and write a short,
human-facing `description`. Where supported, the flag keeps the skill out of
the model's discovery context; the user starts it explicitly.

Allow model invocation by omitting the flag when the agent must start the
skill itself or another skill must reach it. Its description appears in the
model's skill listing, so name what it does and when to use it, with concrete
artifacts and verbs. Put the workflow in the body, not the description.
Split out a model-invoked skill only for a distinct trigger.

## Arguments

`argument-hint` is an autocomplete hint, not a parser or validation schema.
State meaningful defaults, mode selection, missing-input handling, and any
flag that changes behaviour in the body or a required reference. Explain what
syntax leaves unspecified rather than repeating the hint.

## Model tier

Every skill declares `metadata.model-tier` for model-picking harnesses. Pick
from the hardest work the skill does, not its length:

| Tier | Work |
| --- | --- |
| `trivial` | Mechanical tasks and short prose, such as commits and recaps. |
| `moderate` | Code changes, debugging, and multi-file work. |
| `complex` | Planning, design, reviews, domain modelling, and interviews. |
| `frontier` | System-wide redesigns or migrations beyond `complex`. |

When unsure, choose `moderate`.

## Allowed tools

`allowed-tools` pre-approves routine commands in harnesses that honour it,
such as Claude Code. Keep entries narrow and low-risk, such as
`Bash(git status:*)`; leave risky actions to the normal permission prompt.
The skill must also work in harnesses that ignore this field.
