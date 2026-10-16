# Plan Execution Models

Which models [`execute-plan`](../execute-plan/SKILL.md) uses for its subagents.
This is not a global override for other delegation.

## Roles

Keep the user-selected session model as coordinator, at its own effort. The
usual choices are GPT-6.1 Sol through Pi/Copilot and Opus 5.5 through Claude
Code, both at `xhigh`. Don't switch that model or its effort. It owns
decisions, defect diagnosis, acceptance, commits, and the final review.

Two kinds of subagent do the heavy work, so the coordinator's context lasts the
whole plan:

- **Task-list writer:** a premium subagent that follows the to-tasks skill for
  one slice.
- **Implementer:** a cheap subagent that does one task from a finished task
  list. Corrections use the same model.

**Same provider, different model.** The coordinator's provider decides every
subagent's provider. Change the model and effort, never the provider:

- **Pi:** the provider is the one in brackets in the model list, such as
  `github-copilot`. Pick another model from that provider.
- **Claude Code:** the provider is the session's Anthropic connection. Pick
  another Claude model, such as Haiku for the implementer.

| Harness | Task-list writer (premium) | Implementer (cheap) | Effort |
| --- | --- | --- | --- |
| Pi + GitHub Copilot | the session's model | `github-copilot/gpt-6-luna` | `thinking: xhigh` |
| Pi + Amazon Bedrock | the session's model | `amazon-bedrock/global.anthropic.claude-haiku-5-5` | `thinking: xhigh` |
| Claude Code | the session's model | `claude-haiku-5-5` | `effort: xhigh` |

These are the user's chosen tiers, not a claim about realized cost, and the IDs
are pinned preferences, not a guess at the latest release. Verify availability
and effort support at runtime. When you choose a newer implementer, update this
table and the [Claude agent definition](../../../.claude/agents/plan-executor.md)
together, then run `make check-execute-plan` to catch drift.

**Provider unavailable.** If the provider is out of credits or can't be
reached, stop. In Pi, ask which of the other providers in the model list to
use, and propose their cheap implementer and higher-end writer models for the
user to confirm. In Claude Code there's no other provider, so report and stop.

```txt
`github-copilot` is out of credits. Continue on:
1. `amazon-bedrock`
2. `google-vertex`
3. Stop here.
```

A harness and provider pair with no row above is unmapped: stop and ask.

## Enforcement

1. Detect the harness and provider separately: Pi using Anthropic through AWS
   Bedrock is not Claude Code. Don't copy credentials between harnesses.
2. Configure the model and `xhigh` explicitly. Never request `max`, rely on
   inherited settings, or silently pick another model or effort. If support,
   effective settings, or permissions can't be established, return `BLOCKED`.
3. Pi enforces no fallback with a flag, as [its adapter](../execute-plan/references/pi-subagents.md)
   describes. Claude Code has no such flag; follow
   [its preflight and telemetry limits](../execute-plan/references/claude-code.md)
   and don't claim the definition alone fixes the model.
4. Keep ambiguous debugging and design judgment with the coordinator. Premium
   implementation, or an unmapped pair, needs the user's explicit approval.
5. Report requested settings apart from observed ones. Config files and UI
   labels don't prove every request; use transcript or provider metadata and
   say what you couldn't see.
