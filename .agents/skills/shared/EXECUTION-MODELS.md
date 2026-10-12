# Plan Execution Models

Use this policy for [`execute-plan`](../execute-plan/SKILL.md) implementation
and correction subagents, not as a global override for other delegation.

## Roles

Keep the user-selected session model as coordinator. The usual choices are
GPT-6.1 Sol through Pi/Copilot and Opus 5.5 through Claude Code, both at `xhigh`.
Do not switch that model or its effort. It owns slice task compilation,
engineering decisions, defect diagnosis, acceptance, and final review.

| Harness | Implementation model | Effort setting |
| --- | --- | --- |
| Pi + GitHub Copilot | `github-copilot/gpt-6-luna` | `thinking: xhigh` |
| Claude Code | `claude-haiku-5-5` | `effort: xhigh` |

These are the user's chosen lower-cost tiers, not a claim about realized cost.
The identifiers are pinned preferences, not an instruction to guess the latest
release. Verify availability and effort support at runtime; update this table
and the [Claude agent definition](../../../.claude/agents/plan-executor.md)
together when the user chooses a newer worker. Check with
`make check-execute-plan` to catch definition drift.

## Enforcement

1. Detect the harness and provider independently. Pi using Anthropic through
   AWS Bedrock is not Claude Code. Pi/Copilot uses the existing Copilot login;
   Claude Code uses the company Anthropic connection. Do not copy credentials
   between harnesses or route through a different provider as a fallback.
2. Explicitly configure the implementation model and `xhigh`. Never request
   `max`, rely on inherited worker settings, or silently choose another model
   or effort. If support, effective settings, or permissions cannot be
   established, report `BLOCKED` and ask the coordinator for a decision.
3. Enforce Pi's no-fallback flag as described in
   [its adapter](../execute-plan/references/pi-subagents.md). Claude Code has
   no equivalent strict-fallback flag: follow
   [its preflight and telemetry limits](../execute-plan/references/claude-code.md)
   rather than claiming the definition alone guarantees the effective model.
4. Corrections use the same implementation model. Keep ambiguous debugging and
   design judgment with the coordinator. Explicit user approval is required
   before premium implementation or any unmapped harness/provider pairing.
5. Report requested settings separately from observable effective settings.
   Config files and UI labels are not proof of every runtime request. Use
   authoritative transcript/provider metadata where available; disclose gaps.

## Verified configuration sources

- [Pi defaults and per-model thinking](../../../.pi/agent/settings.json)
  already include the Copilot worker at `xhigh`. Its installed Pi catalog
  exposes `xhigh` for GPT-6 Luna; recheck after catalog/provider changes.
- [Claude Code model and effort documentation](https://code.claude.com/docs/en/model-config#adjust-effort-level)
  lists Haiku 5.5 and `xhigh` support.
- [Claude Code subagent configuration](https://code.claude.com/docs/en/sub-agents#supported-frontmatter-fields)
  defines `model`, `effort`, and `maxTurns`. Environment variables, organization
  restrictions, and effort caps can override effective settings.
