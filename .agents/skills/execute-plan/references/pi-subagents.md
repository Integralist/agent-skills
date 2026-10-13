# Pi / pi-subagents Adapter

Use only in Pi with the configured `Integralist/pi-subagents` extension. Read
[the execution model policy](../../shared/EXECUTION-MODELS.md) first.

## Preflight and setup

Inspect the active `spawn_inline_subagent` tool schema. It must expose
`model`, `thinking`, `tools`, `max_turns`, and `allow_model_fallback`.
If the no-fallback field is absent, stop before delegation and give this setup
command, followed by `/reload` in Pi or a fresh session:

```bash
pi update git:github.com/Integralist/pi-subagents
```

The required feature shipped in
[revision fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5](https://github.com/Integralist/pi-subagents/commit/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5).
A source checkout or installed update is not proof the current session loaded
that tool schema. Do not omit the flag to work around an older extension.

Inspect the available/scoped catalog, model credentials without revealing
values, and supported thinking levels. Confirm the exact policy model exists
and supports `xhigh`; `pi --list-models gpt-6-luna` confirms catalog identity,
not a live request or effort application. If the pairing is unmapped, ask.

## Launch

Use `spawn_inline_subagent`: it allows task-specific model, tools, and budget.
Supply all required character/task fields. A typical execution-settings block
is below; take the model from the policy, not a fuzzy family query:

```json
{
  "model": "github-copilot/gpt-6-luna",
  "thinking": "xhigh",
  "allow_model_fallback": false,
  "max_turns": 60,
  "tools": ["read", "grep", "find", "ls", "bash", "edit", "write"]
}
```

Combine it with `name`, `system_prompt`, `prompt`, and `description`. Include
the self-contained packet, exact task key/scope, and execution-procedure path.
For auto execution, carry `mode: auto`, recorded standing authorization, and
relevant decision IDs; this changes no model, fallback, or permission gate.
Launch for one task or bounded correction, not the entire slice; use a fresh
packet for each next task because terminal resumption is not a tool here.
Workers leave checkboxes/staging/commits to the premium coordinator, which
verifies and commits the task before another editing launch.
The child loader omits context files and extension tools: explicitly supply
repository instructions and required conventions; never assume inherited
conversation, MCP access, or an already loaded skill. Its cwd and filesystem
are the main session's, not an isolated worktree. Name the target repository
root in the packet and use absolute file paths/root-qualified commands.

Saved agents are an alternative only when their definitions are verified:
`spawn_named_subagent` does not accept launch-time overrides. Its file must
specify the policy model, `thinking: xhigh`, tools, `maxTurns`, and the YAML
boolean `allowModelFallback: false`. Inline launch avoids an extra installation
step for this coordinator.

## Control and completion

1. Save the returned ID and handle. Launch only one editing subagent. Use
   `list_subagents` for status, `steer_subagent` for course corrections, and
   `stop_subagent` to preserve partial work while stopping. The user can inspect
   the viewer and message `@handle`; these workers are steerable, not sealed.
2. Await the completion notice or retrieve `get_subagent_result` once for its
   ID. A wait that returns still-working leaves the run active; inspect status
   and await its notice rather than starting a duplicate. On stop, wait for
   terminal status before handing the files to another worker.
3. Compare terminal status and completion criteria with actual files/checks.
   `completed` is a lifecycle state, not acceptance. The default budget is 20
   turns plus 3 grace turns; supply the explicit budget and inspect verified
   budget/stop evidence. Retry incomplete work once at a higher budget with
   the same model/effort and the remaining scope after inspecting partial edits.
4. A failed strict run does not retry on the main model and does not roll back
   edits. Inspect partial changes before a fresh correction launch. The
   main conversation cannot programmatically resume a terminal run through
   `steer_subagent`; `@handle` is user input. Do not invent a resume tool.
5. The UI record displays requested/resolved startup settings, not guaranteed
   per-request effective telemetry. Inspect authoritative transcript/model
   metadata where available, distinguish requested from observed effort, and
   report uncertainty. Strict fallback prevents extension-level substitution;
   it is not a claim about a provider gateway's internals.

## Source contracts

- [Spawn schema and strict model selection](https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/index.ts#L174-L242)
- [Inline launch settings](https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/index.ts#L608-L734)
- [Context-file isolation](https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/runner.ts#L262-L272)
- [Runtime fallback guard and partial-failure handling](https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/src/runner.ts#L332-L399)
- [User steering and inspection](https://github.com/Integralist/pi-subagents/blob/fb6a54caf28fc7bf8e0a163c8dc80986bc17dee5/README.md#interacting-with-subagents)
