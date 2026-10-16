# Claude Code adapter

Use this for the Claude Code CLI on the company Anthropic connection, not
Pi/Bedrock. The models and effort come from
[EXECUTION-MODELS.md](../../shared/EXECUTION-MODELS.md).

**Preflight.** The repository's
[plan-executor definition](../../../../.claude/agents/plan-executor.md) sets the
cheap model, `effort: xhigh`, tools, and `maxTurns`. `make install-claude`
installs it; check the active one with `/agents`, because a project or managed
agent of the same name can override it. Use Claude Code v2.1.293 or later for
Haiku 5.5, and confirm the model is permitted and supports `xhigh`. These can
defeat the policy:

- `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` overrides the model.
- `CLAUDE_CODE_EFFORT_LEVEL` overrides the effort.
- A `fallbackModel` setting or `--fallback-model` chain applies to subagents
  too, and can leave the policy model.

If any of them does, or its value is unknown, return `BLOCKED` before edits and
ask for a session without it. Don't change global defaults. Don't copy Pi or
Bedrock credentials.

**Task-list writer.** Launch the native `Agent` tool with a regular subagent and
its `model` set explicitly to the premium model. The packet tells it to follow
[the to-tasks skill](../../to-tasks/SKILL.md) as a plain file, because a
user-only skill can't be preloaded.

**Worker.** Launch the `Agent` tool with `subagent_type: plan-executor` and the
packet. Never override its saved model with an inherited one. Don't give the
`execute-plan` skill its own `model` or `context: fork`; that would move
coordination to another model. Use one editing worker at a time, and
`SendMessage` for direction. Permission prompts follow the user's settings, and
one agent can't approve another's.

**Verify the model.** After each launch, read the model and effort that ran from
the transcript or startup metadata. `/tasks` shows them to a person, but you
can't call it as a tool, so if you can't read them, ask the user to check or
return `BLOCKED`. Claude Code has no strict no-fallback flag like Pi's, so the
definition alone doesn't guarantee the model that ran. Say so in the report.

**Retry.** A `maxTurns` partial return is incomplete: inspect its edits and
retry once at a higher budget, as
[completion and retry](../../shared/SUBAGENT-STEERABILITY.md#completion-and-retry)
describes. If you can't raise the budget without configuration authority, report
that and stop. Use a regular named subagent for every launch; one context is not
a separate checkout.

## References

- [Agent fields, models, and effort](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields)
- [Model substitutions and selection order](https://code.claude.com/docs/en/sub-agents#choose-a-model)
- [Fallback chains also affect subagents](https://code.claude.com/docs/en/model-config#fallback-model-chains)
- [Effort support, overrides, and caps](https://code.claude.com/docs/en/model-config#adjust-effort-level)
