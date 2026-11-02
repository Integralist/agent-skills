# Plan Execution Models

Models for [`execute-plan`](../execute-plan/SKILL.md) subagents. This does not
override other delegation.

## Roles

Keep the user-selected session model as coordinator, at its own effort. The
usual choices are GPT-6.1 Sol through Pi/Copilot and Opus 5.5 through Claude
Code, both at `xhigh`. Do not switch that model or its effort. It owns
decisions, defect diagnosis, acceptance, commits, and final review.

Two subagent roles preserve the coordinator's context through the plan:

- **Task-list writer:** a premium subagent that follows the to-tasks skill for
  one slice.
- **Implementer:** a cheap subagent that does one task from a finished task
  list. Corrections use the same model.

**Same provider, different model.** The coordinator's provider sets each
subagent's provider. Change model and effort, never provider:

- **Pi:** the provider is the one in brackets in the model list, such as
  `github-copilot`. Pick another model from that provider.
- **Claude Code:** the provider is the session's Anthropic connection. Pick
  another Claude model, such as Haiku for the implementer.

| Harness | Task-list writer (premium) | Implementer (cheap) | Effort |
| --- | --- | --- | --- |
| Pi + GitHub Copilot | the session's model | `github-copilot/gpt-6-luna` | `thinking: xhigh` |
| Pi + Amazon Bedrock | the session's model | `amazon-bedrock/global.anthropic.claude-haiku-5-5` | `thinking: xhigh` |
| Claude Code | the session's model | `claude-haiku-5-5` | `effort: xhigh` |

These are the user's chosen tiers, not realized-cost claims. IDs are pinned
preferences, not guesses at the latest release. Verify availability and effort
support at runtime. To choose a newer implementer, update this table and the
[Claude agent definition](../../../.claude/agents/plan-executor.md), then run
`make check-execute-plan` to catch drift.

**Provider unavailable.** If the provider is out of credits or unreachable,
stop. In Pi, ask which other listed provider to use and propose its cheap
implementer and higher-end writer models for the user to confirm. Claude Code
has no other provider; report and stop.

```txt
`github-copilot` is out of credits. Continue on:
1. `amazon-bedrock`
2. `google-vertex`
3. Stop here.
```

An unlisted harness/provider pair is unmapped: stop and ask.

## Enforcement

1. Detect the harness and provider separately: Pi using Anthropic through AWS
   Bedrock is not Claude Code. Do not copy credentials between harnesses.
2. Configure the model and `xhigh` explicitly. Never request `max`, rely on
   inherited settings, or silently pick another model or effort. If support,
   effective settings, or permissions cannot be established, return `BLOCKED`.
3. Pi enforces no fallback with a flag, as [its adapter](../execute-plan/references/pi-subagents.md)
   describes. Claude Code has no such flag; follow
   [its preflight and telemetry limits](../execute-plan/references/claude-code.md)
   and do not claim the definition alone fixes the model.
4. Keep ambiguous debugging and design judgment with the coordinator.
   Premium implementation or an unmapped pair requires the user's explicit
   approval.
5. Report requested and observed settings separately. Config files and UI
   labels do not prove every request; use transcript or provider metadata and
   say what you could not see.
