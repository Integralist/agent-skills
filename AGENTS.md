## Domain Language

Canonical domain terms and their relationships live in `GLOSSARY.md`. Consult
it before introducing or reusing terminology.

## Model Configuration

- Route Claude Code through the company Anthropic account; use Anthropic model
  IDs in `.claude/settings.json.tmpl`, not Bedrock ARNs.
- Route Pi and OpenCode Claude models through Amazon Bedrock using the AWS SSO
  `bedrock` profile. Do not reuse Claude Code subscription credentials in
  other harnesses.
- In OpenCode, use the Bedrock profile ID with the `amazon-bedrock/` provider
  prefix. In Pi, add provider-prefixed Bedrock IDs to `enabledModels`.
- When changing a model, update each harness's defaults, model catalog,
  allowlist, and favorites as applicable. Verify the provider-specific ID and
  model limits.
- If a harness does not supply pricing metadata, update its repo-owned model
  registry (for example, `.pi/agent/models.json`). Verify input/output and
  applicable cache or tiered rates against current provider pricing; keep the
  registry's units and never carry rates over from an older model without
  confirmation.
