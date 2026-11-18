# Pi catalog reference

Use this reference to fetch blocked provider docs, inspect Pi's native model
catalog without `models.json` interference, choose between `models[]` and
`modelOverrides`, and verify edits.

## Fetch provider documentation

Try `curl` first. When an announcement site returns Cloudflare or HTTP 403
(such as `openai.com`), fetch through `r.jina.ai` and follow links to the
developer API docs:

```bash
curl -sSL -A "Mozilla/5.0" "https://r.jina.ai/<url>"
```

On `developers.openai.com`, append `.md` to model and guide URLs (for example,
`https://developers.openai.com/api/docs/models/<model-id>.md`) for clean
Markdown specs with context limits, rejected reasoning levels, and tiered rates.

## Inspect Pi's native catalog

`pi --list-models` merges Pi's bundled catalog, `~/.pi/agent/models-store.json`,
and `~/.pi/agent/models.json`. Passing `--offline` only disables network
catalog refreshes; it still applies `~/.pi/agent/models.json`.

To see what Pi supports natively without `models.json` overrides:

```bash
# Query Pi's synced catalog (replace "google-vertex" with another provider ID)
jq -r '."google-vertex".models[] | [.id, .contextWindow, .maxTokens] | @tsv' \
  ~/.pi/agent/models-store.json
```

Check Pi's bundled provider data as well when a provider or peer model's `api`,
`headers`, or `compat` fields are missing from `models-store.json`:

```bash
pi_data="$(npm root -g)/@earendil-works/pi-coding-agent/node_modules/@earendil-works/pi-ai/dist/providers/data"
ls "$pi_data"
```

## Choose models vs modelOverrides

Pi ignores `modelOverrides` for model IDs that do not exist in its catalog.

| Catalog state | `.pi/agent/models.json` action |
| --- | --- |
| Absent from Pi catalog | Add full entry under `providers.<id>.models[]` and put `cost` in `modelOverrides.<model>.cost` so `models[]` is easy to drop later. |
| Present with matching defaults | Remove from both `models[]` and `modelOverrides`. |
| Present, custom values needed | Omit from `models[]`; keep only the differing fields in `modelOverrides.<model>`. |

For `github-copilot` `openai-responses` models added under `models[]`, copy
the `headers` and `compat` fields from a peer model in
`$pi_data/github-copilot.json` (for example `gpt-6.1-sol`) so Copilot request
headers and mid-conversation tool features match.

## Verify after editing

1. Validate JSON syntax and whitespace:

   ```bash
   python3 -m json.tool .pi/agent/models.json >/dev/null
   python3 -m json.tool .pi/agent/settings.json >/dev/null
   git diff --check
   ```

2. Test loading the repo's `.pi/agent/models.json` in an isolated
   `PI_CODING_AGENT_DIR` before installing globally:

   ```bash
   d=$(mktemp -d)
   ln -s ~/.pi/agent/auth.json ~/.pi/agent/models-store.json "$d/"
   cp .pi/agent/models.json "$d/models.json"
   PI_CODING_AGENT_DIR="$d" pi --offline --list-models "<provider>/<model>"
   rm -rf "$d"
   ```

   Confirm Pi prints the expected `context`, `max-out`, `thinking`, and
   `images` values with no `Warning: errors loading models.json` output.
3. If `--install` was passed or confirmed, run `make install-pi PI_MODELS=true`.
