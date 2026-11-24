# Skill mechanics

Frontmatter controls skill discovery and harness configuration. Behaviour the
agent must follow belongs in the body or an explicitly required reference;
metadata is not a substitute for instructions.

## Naming

Prefer noun-first `<noun>-<verb>` skill names (such as `pr-open`, `pr-merge`,
`worktree-cleanup`) so related skills group together alphabetically. Keep
natural `<verb> <noun>` trigger phrases (`"open a PR"`, `"merge a PR"`) in
`description` so user prompts still match regardless of word order.

## Invocation

Default to user-invoked: set `disable-model-invocation: true` and write a short,
human-facing `description`. Where supported, the flag keeps the skill out of
the model's discovery context; the user starts it explicitly.

Allow model invocation by omitting the flag when the agent must start the
skill itself, another skill must reach it, or it guards quality when a
recurring problem appears (such as ambiguity or stiff prose). Whenever you
remove `disable-model-invocation: true` from an existing skill, audit and
update `description` with explicit `Use when ...` trigger phrases for model
discovery. Its description appears in the model's skill listing, so phrase
triggers in the user's symptom words rather than internal skill jargon, using
concrete artifacts and verbs. Put the workflow in the body, not the
description. Split out a model-invoked skill only for a distinct trigger.

## Arguments

`argument-hint` is an autocomplete hint, not a parser or validation schema.
Keep `[steering]` as the only optional positional argument so users can always
pass freeform instructions without colliding with named inputs. Use `--flag`,
`--key=<value>`, or `--key[=<value>]` for every optional target, path, ref,
option, and mode toggle—never multiple positional arguments, bare mode
keywords, or space-separated optional flag values (such as
`--cleanup [<branch>]`). Bind optional values with `=` so flags work in any
position and cannot swallow trailing `[steering]` words; format numbered
GitHub items with `#<...>` (such as `--pr=<url|#number>` or
`--source=<path|#issue|url>`). State meaningful defaults, mode selection,
missing-input handling, and any flag that changes behaviour in the body or a
required reference. Explain what syntax leaves unspecified rather than
repeating the hint.

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
