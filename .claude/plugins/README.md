# Claude Code mods

This folder holds **mods**: Claude Code plugins built from TypeScript function
hooks. `make install-claude` copies each one to `~/.claude/mods/`, and
`CLAUDE_CODE_PLUGIN_DIRS` in `.claude/settings.json.tmpl` loads them in every
session.

| Mod                         | What it does                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| [`auto-model`](auto-model/) | Picks the main conversation's model for each typed prompt or skill; caps effort at `xhigh`. |
| [`clean-view`](clean-view/) | Hides tool calls and output while Claude works; shows a plain checklist above the prompt.   |

## How a mod works

A mod is a folder with three files, plus an optional fourth:

```txt
auto-model/
├── .claude-plugin/plugin.json   # name, version, description, "types"
├── hooks/hooks.json             # { "modules": ["./register.tsx"] }
├── hooks/register.tsx           # export const register: Register = on => { ... }
├── types/index.d.ts             # optional: the mod's $.state contract
└── tests/*.test.ts              # run by `claude plugin test`
```

`register(on)` attaches hooks to engine events with `on(event, matcher?, hook)`.
Every hook has the shape `($, e, next)`:

- `$` is the engine interface: `$.ui.toast`, `$.config.set`, `$.model.complete`,
  `$.store`, and so on.
- `e` is the event's input, such as the prompt text or the tool call.
- `next(e)` passes the event on to other plugins, then to Claude Code itself.
  A hook can rewrite the event (`next({ ...e, text })`) or answer it without
  calling `next`.

The module runs in a sandbox with no Node and no DOM. It reaches everything
through `$`. JSX compiles against a global `h`, so never name a variable `h`
in a `.tsx` file.

The API is early access and changes between Claude Code releases. The source of
truth is the declaration file Claude Code writes beside a loaded mod, at
`.claude-plugin/types/claude-code/index.d.ts`. That file and the mod's
`tsconfig.json` are generated, so `.gitignore` excludes them.

## `~/.claude/plugins/` versus `~/.claude/mods/`

| Path                 | Owner              | How plugins get there                                 |
| -------------------- | ------------------ | ----------------------------------------------------- |
| `~/.claude/plugins/` | Claude Code        | `/plugin install` from a marketplace; cached copies   |
| `~/.claude/mods/`    | this repo (`make`) | `make install-claude` copies `.claude/plugins/*` here |

`~/.claude/plugins/` is Claude Code's managed store: `installed_plugins.json`,
`cache/`, `marketplaces/`. Claude Code only loads plugins it has installed
itself, so a folder copied in by hand is never loaded, and a reinstall or
cache sweep can remove it.

`~/.claude/mods/` is a plain folder that Claude Code does not manage. Claude
Code loads a mod from it only because `CLAUDE_CODE_PLUGIN_DIRS` in the `env`
block of `~/.claude/settings.json` names that mod's folder. Each entry acts like
`claude --plugin-dir <folder>`. In an interactive session the folder is also
watched, so an edit reloads the mod without a restart.

## What `make install-claude` does

```make
rsync -a --delete --exclude='/README.md' --exclude='.claude-plugin/types/' \
  --exclude='tsconfig.json' .claude/plugins/ ~/.claude/mods/
```

- **Copy, not symlink:** this matches how the target installs `rules/`,
  `agents/` and `scripts/`. A repository checkout on a branch never changes the
  live mod until you run `make` again.
- **`--delete`:** a mod removed from the repository is also removed from
  `~/.claude/mods/`. This folder belongs to `make`, so keep hand-made mods
  elsewhere.
- **Excludes:** Claude Code writes `.claude-plugin/types/` and `tsconfig.json`
  beside each loaded mod. Excluding them keeps `--delete` from removing those
  generated files on every install.

The settings template then loads the mod:

```json
"env": {
  "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/auto-model:~/.claude/mods/clean-view"
}
```

> [!IMPORTANT]
> `CLAUDE_CODE_PLUGIN_DIRS` names each mod folder, not their parent. When you
> add a mod, append its folder with `:` as the separator, for example
> `~/.claude/mods/auto-model:~/.claude/mods/other`.

## Adding or changing a mod

1. Create `.claude/plugins/<name>/` with the files above. For the
   authoring workflow, ask Claude Code to "make a mod". The bundled
   `plugin-authoring` skill writes the mod and hot-reloads it while you iterate.

2. Check it:

   ```bash
   claude plugin validate .claude/plugins/<name>
   claude plugin test .claude/plugins/<name>
   ```

3. Add `~/.claude/mods/<name>` to `CLAUDE_CODE_PLUGIN_DIRS` in
   `.claude/settings.json.tmpl`.

4. Run `make install-claude`, then start a new Claude Code session.

To try a mod without installing it, run
`claude --plugin-dir .claude/plugins/<name>`.

## `auto-model`

- **Turn it on or off:** run `/automodel on`, `/automodel off` or
  `/automodel status`, or click the `Auto Model: On/Off` chip at the right of
  the prompt footer. The setting is saved across sessions.
- **What it does:** before each prompt you type is sent, the smallest model
  sorts it as `trivial`, `moderate`, `complex` or `frontier` (8 tokens, 4
  seconds). Those tiers map to the `haiku`, `sonnet`, `opus` and `fable`
  lines that the `/config` model row offers. A 10-second toast names the new
  model.
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
  [model tier](../../.agents/skills/writing-for-agents/SKILL-MECHANICS.md#model-tier).
- **When it leaves the model alone:** short replies (fewer than four words, or
  replies such as "yes" or "keep going"), built-in slash commands, messages
  sent while Claude is working, and helper agents.
- **Fallbacks:** if the quick check fails, a keyword guess is used, with
  `complex` when in doubt. If the plan refuses a model, it steps down a line.
- **Turning it off:** restores the model you used before. Picking a model by
  hand (`/model` or `/config`) also turns it off, and keeps the model you
  picked.
- **Effort cap:** `/effort max` becomes `xhigh`, and every request, helper
  agents included, is sent at `xhigh` at most, even while Auto Model is off.

> [!NOTE]
> Switching models writes `model` to `~/.claude/settings.json`, as `/model`
> does. A new session starts on the last model Auto Model picked. The next
> `make install-claude` resets it to the template's default.

## `clean-view`

- **Turn it on or off:** click the `Clean View: ON/OFF` button at the right of
  the band above the prompt, or run `/simple on`, `/simple off` or `/simple`
  (flips it). The setting is saved across sessions. It starts on.
- **What it does:** while on, tool calls, diffs and command output are hidden.
  A checklist above the prompt shows the job's name, how long it has run, and
  each step with a 10-cell meter. The header switches to **Needs you**,
  **Stuck**, **Stopped** or **All done** as the job changes.
- **How the plan arrives:** the mod gives Claude two tools, `plan_steps` and
  `report_progress`, and blocks every other tool until a plan exists. A to-do
  list (TodoWrite, TaskCreate) also counts as the plan.
- **Cost:** each new job makes one small Haiku call to name it.

> [!WARNING]
> Where an organization manages Claude Code, `prompt.compose` and
> `classic.Notification` hooks don't run in a mod you install. The system
> prompt section is then skipped; the tool descriptions and the plan-first
> gate still steer Claude to plan, and Needs you still shows for permission
> prompts through `tool.check`.
