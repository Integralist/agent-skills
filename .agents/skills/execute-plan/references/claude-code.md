# Claude Code Adapter

Use this adapter for the Claude Code CLI on the company Anthropic connection,
not Pi/Bedrock. Read [the model policy](../../shared/EXECUTION-MODELS.md).

## Setup and preflight

The repository's [plan-executor definition](../../../../.claude/agents/plan-executor.md)
supplies the explicit model, `effort: xhigh`, tools, and `maxTurns`. Install it
with the repository's existing `make install-claude` target, then verify the
active definition in Claude Code with `/agents`. A project or managed agent
of the same name can override the user definition; inspect the active one.

Use Claude Code v2.1.293 or later for Haiku 5.5. Confirm the model is permitted
and supports `xhigh`; check model/provider defaults, organization restrictions,
effort caps, and effective environment overrides without exposing secrets.
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` can override agent model selection;
`CLAUDE_CODE_EFFORT_LEVEL` can override its effort. If either defeats the policy,
return `BLOCKED`; never bypass permissions or copy Pi/Bedrock credentials.
Inspect the effective `fallbackModel` setting and any `--fallback-model` chain:
Claude Code applies those chains to subagents too. If a chain can leave the
policy model, or its effective value is unknown, return `BLOCKED` before edits.
Ask for a session with no such chain; do not change global defaults silently.

Keep the coordinator in the existing main conversation. Do not put a worker
`model` or `context: fork` on the `execute-plan` skill: that would move its
coordination into another model/context. Use a regular named subagent, not a
conversation fork that necessarily inherits the main model.

## Launch, verify, and authorize edits

1. Invoke the native `Agent` tool with `subagent_type: plan-executor`, a concise
   description, and the self-contained packet with `stage: readiness`.
   Do not override the saved model with an inherited/default model. The first
   pass is read-only and must return `READY_ONLY`, not implement the slice.
2. Save the agent ID. Check authoritative startup/transcript model metadata
   and effective effort information. `/tasks` exposes model/effort for human
   inspection, but do not assume the main model can invoke that UI command as
   a tool. If runtime metadata is not programmatically accessible, ask the
   user to verify the row or report `BLOCKED` rather than claiming certainty.
3. Only after the cheap model and `xhigh` are verified, resume the same agent
   via `SendMessage` using its ID with the `stage: execute` packet and recorded
   user authorization. In auto mode, use the recorded flag authority and
   decision IDs; no repeat execution confirmation is needed. Keep readiness,
   runtime verification, and permission gates intact. The agent reads the plain
   [slice execution procedure](../../next-slice/EXECUTE.md), not a preloaded
   user-only `next-slice` skill. Assign one task key/scope from the document.
   It implements only that task and returns evidence without updating
   checkboxes or committing. The coordinator verifies and commits before
   assigning the next task; each resumed packet names the new HEAD and scope.
4. Use native status/completion controls, `SendMessage` for direction, and
   available stop controls. Permission prompts still follow the user's
   settings; an agent's message cannot approve another agent's permissions.
   Inspect partial changes before retrying/resuming. Treat a `maxTurns` partial
   return as incomplete and follow the shared higher-budget retry protocol.
5. Recheck requested versus observed model/effort on resumed/correction runs.
   If a native mechanism cannot raise the resumed budget, create a fresh
   definition/launch with the same model and higher `maxTurns` only with proper
   configuration authority; otherwise report the limitation and stop.

## Limits and recovery

Claude Code has no Pi-style `allow_model_fallback` flag. Restricted model values
can be substituted with another permitted or inherited model, configured
fallback chains can switch mid-run, and effort can be clamped. The definition
alone is therefore not a strict cheap-only runtime
guarantee. The readiness gate prevents authorizing implementation on an
unverified model; it cannot promise that no premium startup request occurred.
Report that distinction in the model-usage report.

Use the exact worker ID from the policy, do not silently accept a remapped
family alias, and stop when matching settings cannot be established. Avoid
setting global subagent/environment defaults just for this workflow: those
would change unrelated delegation. Background subagents cannot resolve every
interactive permission or user question, so surface blockers in the main
conversation. An isolated context is not necessarily an isolated checkout;
use one editing worker at a time. If opting into worktrees later, explicitly
preserve accepted dependencies and integrate patches before accepting a slice.

## Authoritative references

- [Agent fields, models, and effort](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields)
- [Model substitutions and selection order](https://code.claude.com/docs/en/sub-agents#choose-a-model)
- [Configured fallback chains also affect subagents](https://code.claude.com/docs/en/model-config#fallback-model-chains)
- [Effort support, overrides, and caps](https://code.claude.com/docs/en/model-config#adjust-effort-level)
- [Startup context and resumption](https://code.claude.com/docs/en/sub-agents#manage-subagent-context)
- [User-only skills cannot be preloaded](https://code.claude.com/docs/en/skills#supported-frontmatter-fields)
