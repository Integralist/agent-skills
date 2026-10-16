# clean-view

Hides tool calls and output while Claude works; shows a plain checklist above
the prompt.

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
