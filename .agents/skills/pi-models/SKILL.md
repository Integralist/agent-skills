---
name: pi-models
description: >-
  Add, update, or prune Pi model definitions, overrides, and enabled models in
  .pi/agent/models.json and .pi/agent/settings.json from provider docs or an
  announcement URL.
argument-hint: "[URL | model-name] [--provider=<id>] [--prune] [--install]"
disable-model-invocation: true
metadata:
  model-tier: moderate
---

Keep `.pi/agent/models.json` and `.pi/agent/settings.json` current when new
models launch or when Pi adds native support for models you previously
overrode.

**Source of truth.** Always edit the repository's `.pi/agent/models.json` and
`.pi/agent/settings.json`, never the installed copies under `~/.pi/agent/`.
Check the repository's `AGENTS.md` for provider routing rules (such as Bedrock
profile IDs and pricing verification) before proposing edits.

## Arguments and modes

- **`URL | model-name`** (optional): announcement URL, API docs URL, or model
  ID to add or update. If omitted without `--prune`, inspect current configs
  and ask what model or source URL to add, update, or prune.
- **`--provider=<id>`** (optional): target Pi provider ID (`github-copilot`,
  `google-vertex`, `amazon-bedrock`, and so on). Infer from the source or
  existing configuration when omitted; ask if still ambiguous.
- **`--prune`**: audit `.pi/agent/models.json` against Pi's native catalog
  (`~/.pi/agent/models-store.json` and bundled provider data) and propose
  removing entries Pi now supports natively.
- **`--install`**: run `make install-pi PI_MODELS=true` after edits pass
  verification.

## Workflow

1. **Locate the source repo.** Confirm the working tree owns
   `.pi/agent/models.json` and `.pi/agent/settings.json` (typically
   `agent-skills`). Read both files and check `git status` for existing edits.
2. **Gather authoritative model specs.** When adding or updating a model, fetch
   the supplied URL and follow through to the provider's API model docs and
   pricing tables. Verify model ID, `api` type, `contextWindow`, `maxTokens`,
   `reasoning` and `thinkingLevelMap` (including rejected levels such as `none`
   or `minimal`), `input` modalities, and standard plus tiered rates. Never
   guess or carry over rates from an older model without confirmation.
3. **Inspect Pi's native catalog.** Read
   [the Pi catalog reference](references/PI-CATALOG.md) before checking
   `~/.pi/agent/models-store.json` and bundled provider data. Use it to decide
   between `models[]`, `modelOverrides`, or pruning.
4. **Plan `.pi/agent/settings.json` updates.** Add new `<provider>/<id>`
   entries to `enabledModels` and remove superseded models when replacing an
   earlier version. Update `defaultModel` or `modelThinkingLevels` only when
   asked or when replacing a configured model, keeping levels valid under
   `thinkingLevelMap`.
5. **Confirm before writing.** Present the proposed changes (full diff, or a
   one-line summary with the option to inspect the full diff when over 40
   lines) plus any unverified provider-side assumptions (such as whether a
   proxy like `github-copilot` exposes a brand-new upstream ID). Write only
   after explicit approval.
6. **Verify and optionally install.** Complete the
   [verification checklist](references/PI-CATALOG.md#verify-after-editing) after
   writing. Run `make install-pi PI_MODELS=true` only when `--install` was
   passed or the user confirms.
