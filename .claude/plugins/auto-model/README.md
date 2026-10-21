# auto-model

Picks the main conversation's model for each typed prompt or skill; caps effort
at `xhigh`.

- **Turn it on or off:** run `/automodel on`, `/automodel off` or
  `/automodel status`, or click the `Auto Model: On/Off` chip at the right of
  the prompt footer. The setting is saved across sessions.

- **What it does:** before each prompt you type is sent, the smallest model
  sorts it as `trivial`, `moderate`, `complex` or `frontier` (8 tokens, 4
  seconds). Those tiers map to the `haiku`, `sonnet`, `opus` and `fable`
  lines that the `/config` model row offers. A 10-second toast names the new
  model.

- **Status line:** the tier of the model in use is written to
  `$TMPDIR/claude-auto-model/<session-id>` (`auto` before the first prompt is
  routed), and `.claude/scripts/statusline.sh` shows `Auto` until a turn picks a
  model, then `Opus 5.5 medium (complex)`. The OS clears the temp folder, so
  files from ended sessions don't pile up.

- **Skills:** running a skill by slash command uses the tier its `SKILL.md`
  declares, read from the project's `.claude/skills/` first, then
  `~/.claude/skills/`:

  ```yaml
  metadata:
    model-tier: trivial # trivial | moderate | complex | frontier
  ```

  | Tier       | Model line |
  | ---------- | ---------- |
  | `trivial`  | `haiku`    |
  | `moderate` | `sonnet`   |
  | `complex`  | `opus`     |
  | `frontier` | `fable`    |

  A skill without a tier, or a plugin's skill, is sorted once by its
  description, and that tier is kept until the description changes. For how to
  pick a tier, see
  [model tier](../../../.agents/skills/writing-for-agents/SKILL-MECHANICS.md#model-tier).

- **When it leaves the model alone:** short replies (fewer than four words, or
  replies such as "yes" or "keep going"), built-in slash commands, messages
  sent while Claude is working, and helper agents.

- **Prompt cache:** a switch re-sends the whole conversation uncached. So for
  an hour after a turn ends, while the cache is warm, a typed prompt or a skill
  run by slash command only steps up to a bigger model; a smaller tier keeps
  the current one, as it is likely the same task and the cheaper model would be
  handed the whole context. Once the cache has gone cold, a switch costs
  nothing extra and either goes by its tier.

- **Fallbacks:** if the quick check fails, a keyword guess is used, with
  `moderate` when in doubt. If the plan refuses a model, it steps down a line.

- **Turning it off:** restores the model you used before. Picking a model by
  hand (`/model` or `/config`) also turns it off, and keeps the model you
  picked.

- **Effort cap:** `/effort max` becomes `xhigh`, and every request, helper
  agents included, is sent at `xhigh` at most, even while Auto Model is off.

> [!NOTE]
> Switching models writes `model` to `~/.claude/settings.json`, as `/model`
> does. A new session starts on the last model Auto Model picked. The next
> `make install-claude` resets it to the template's default.
