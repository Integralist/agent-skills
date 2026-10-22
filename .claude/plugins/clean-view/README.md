# clean-view

Hides tool calls and output while Claude works; shows a plain checklist above
the prompt.

- **Turn it on or off:** click the `Clean View: ON/OFF` button at the right of
  the band above the prompt, or run `/simple on`, `/simple off` or `/simple`
  (flips it). The setting is saved across sessions. It starts on.
- **What it does:** while on, tool calls, diffs and command output are hidden.
  A checklist above the prompt shows activity and elapsed time until the plan
  supplies a job title. It then shows the title and each step's 10-cell meter.
  The header switches to **Needs you**,
  **Stuck**, **Stopped** or **All done** as the job changes.
- **Task details:** Click **Details** beside a task to open a live pane with
  its status, reported progress, run time, and last visible activity. Use
  **Previous task** and **Next task** (↑/↓ walks the buttons) to move between tasks, **Stop entire run** to end
  the run, and **Esc** or **Close** to close the pane.
- **How the plan arrives:** the mod gives Claude two tools, `plan_steps` and
  `report_progress`, and blocks every other tool until a plan exists. The
  optional `plan_steps.title` names the job; replanning without a title keeps
  the existing one. A to-do list (TodoWrite, TaskCreate) also counts as the plan.
- **Replanning:** if the work grows past the plan, a second `plan_steps` updates
  the list and keeps finished steps checked off.
- **Cost:** job titles come from the plan, without a separate model request.

> [!WARNING]
> Where an organization manages Claude Code, a managed plugin can skip a mod's
> `prompt.compose` and `classic.*` hooks. The system prompt section is then
> skipped; the tool descriptions and the plan-first gate still steer Claude to
> plan. The permission mode is then unknown, so Needs you can show for an ask
> auto mode settles alone; the next model request clears it.
