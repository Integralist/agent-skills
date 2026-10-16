# Pi adapter

Use this only in Pi with the `Integralist/pi-subagents` extension. The models and
effort come from [EXECUTION-MODELS.md](../../shared/EXECUTION-MODELS.md).

**Preflight.** The active `spawn_inline_subagent` schema must expose `model`,
`thinking`, `tools`, `max_turns`, and `allow_model_fallback`. If the fallback
field is missing, stop and give this setup command, then `/reload` or a fresh
session. Never leave the flag out to get around an old extension:

```bash
pi update git:github.com/Integralist/pi-subagents
```

An installed update doesn't prove the current session loaded the new schema.
Confirm the exact policy models exist in the scoped catalog, have credentials
(without printing them), and support `xhigh`.

**Launch** the task-list writer and each worker with `spawn_inline_subagent`.
Take the model from the policy table, not a fuzzy family match: the premium
model for the writer, the cheap one for a worker. Set the rest like this:

```json
{
  "model": "github-copilot/gpt-6-luna",
  "thinking": "xhigh",
  "allow_model_fallback": false,
  "max_turns": 60,
  "tools": ["read", "grep", "find", "ls", "bash", "edit", "write"]
}
```

Add `name`, `system_prompt`, `prompt`, and `description`. The writer's packet
points at [the to-tasks skill](../../to-tasks/SKILL.md). A worker's packet
names its one task and [the worker procedure](worker.md); give it a fresh packet
for each task, because a finished run can't be resumed from here. Child agents
load no context files, extension tools, or MCP, so put the repository
instructions and conventions in the packet. They share the main session's
checkout, so name the repository root and use absolute paths. Run one editing
subagent at a time.

**Control.** Keep the returned ID and handle. Use `list_subagents` for status,
`steer_subagent` to redirect, and `stop_subagent` to stop while keeping partial
work. Wait for the completion notice, or call `get_subagent_result` once; a wait
that returns "still working" leaves the run active, so don't start a duplicate.
`completed` is a lifecycle state, not acceptance: compare it with the files and
checks. Supply an explicit budget, because the default is 20 turns plus 3 grace.

**Retry.** Inspect partial edits, then retry once at a higher budget with the
same model and effort. A failed strict run doesn't fall back to the main model
and doesn't roll back its edits.

**Verify the model.** The UI shows requested and resolved startup settings, not
per-request telemetry. Check the transcript for the model that ran, tell
requested from observed effort, and report what you can't confirm.

## Source contracts

- [Spawn schema and strict model selection](https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/index.ts#L174-L242)
- [Inline launch settings](https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/index.ts#L608-L734)
- [Runtime fallback guard](https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/runner.ts#L332-L399)
