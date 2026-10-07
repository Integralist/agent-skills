# LLM stats data and views

## Sources

The [current API docs](https://artificialanalysis.ai/data-api/docs) and
[OpenAPI contract](https://artificialanalysis.ai/api/v2/openapi) document:

- Endpoint: `GET https://artificialanalysis.ai/api/v2/language/models/free`.
  Fetch successive `?page=N` responses until `pagination.has_more` is false.
- Authentication: `x-api-key` header. Generate a free key in the Artificial
  Analysis Insights Platform; set `ARTIFICIAL_ANALYSIS_API_KEY` locally.
- Free API limit: 100 requests per fixed 24-hour window, shared within the
  user's organization quota scope. One request fetches each page; the complete
  catalog currently takes four requests. Cache the complete normalized dataset
  for 24 hours in `~/.cache/llm-stats/models.json`.
- Attribution: link to `https://artificialanalysis.ai/` when displaying or
  sharing data. Data remains subject to the site's data-use terms.
- Keys belong in server-side code, not browser JavaScript.

The Free endpoint supplies Intelligence, Coding, and Agentic indices;
Intelligence Index total benchmark cost and weighted cost per task;
input/output token prices; and nested median performance measurements. Missing
scores and costs remain absent rather than being treated as zero.

Map `artificial_analysis_intelligence_index_cost.cost_per_task.total_cost` to
`cost_per_task.intelligence`. Preserve the sibling `total_cost` separately in
`total_benchmark_cost.intelligence` for JSON export. These costs belong to the
Intelligence Index, not to Coding/Agentic or DeepSWE. Import a matching export
for another benchmark's cost chart; never infer task costs from token prices.

The old `/api/v2/data/llms/models` endpoint returned token prices without these
benchmark-cost fields. Its cache is incompatible with this chart: the generator
refreshes it once even if it is less than 24 hours old. Cache schema version 2
records the endpoint, tier, index version, page count, and normalized models.
If a later page fails, pagination is inconsistent, versions change between
pages, or duplicate slugs appear, preserve the old cache and report.

Keep an existing report when fetching fails. A failed refresh is an error,
not a silent switch to stale or demo data. A cache younger than 24 hours can
be used without an API key. For an older offline snapshot, pass its JSON file
with `--input`; the page identifies it as an imported export.

## Commands

Preview the interaction with visibly synthetic data:

```bash
make -C <skill-base-dir> preview
```

Fetch real data using the configured personal 1Password item:

```bash
make -C <skill-base-dir> report
```

Reuse the 24-hour cache by default. Force a fresh request only when needed:

```bash
make -C <skill-base-dir> report ARGS="--refresh"
```

The default view is Artificial Analysis Intelligence Index versus reported
weighted benchmark cost per task, for both real data and previews. DeepSWE is
an optional benchmark label, not the default and not a separate data service.
Use the page's selectors to choose another available benchmark or metric.

### 1Password account safety

The `report` target in [Makefile](../Makefile) owns the personal account and
secret-reference settings. The generator captures `op read` output in memory;
keys are never printed, written to cache, passed on process command lines, or
embedded in HTML. A fresh API cache skips both 1Password and the API request.
An existing `ARTIFICIAL_ANALYSIS_API_KEY` or `AA_API_KEY` overrides 1Password.

Each read specifies `--account my.1password.com`. The
[1Password account-selection rules](https://www.1password.dev/cli/use-multiple-accounts)
give this flag precedence over `OP_ACCOUNT` and the most recently signed-in
account, so `~/.zshrc` can continue signing into Fastly unchanged. The generator
never runs `op signin` or `op signout` automatically.

If the read fails, sign in to the personal account in your terminal, then retry:

```bash
op signin --account my.1password.com
make -C <skill-base-dir> report
```

Signing in can change the default for commands that omit `--account`; explicitly
scoped commands still use their named account. With desktop app integration,
1Password may prompt for biometric approval. Without app integration, follow the
CLI's session-token instructions locally and keep the token out of chat.

For other credentials, run the generator directly with `--op-reference` and
`--op-account`, or set an API-key environment variable. Both 1Password flags
are required when using that source.

Import a cost-per-task export; replace the column names with those in the file:

```bash
python3 <skill-base-dir>/scripts/report.py \
  --input /path/to/export.csv --benchmark deepswe --x cost \
  --score-column "DeepSWE" --cost-column "Avg Cost per Task"
```

Inspect the header first. These example headings are not a claim about every
Artificial Analysis download. Map `--tokens-column` and `--time-column` when
needed. The time axis expects output-generation seconds, not wall-clock task
duration. Use a separate benchmark key for changed benchmark versions or
grading methods rather than comparing unlike runs.

## JSON

Accept either the documented API response (`{"data": [...]}`), a native model
array, or a JSON snapshot exported by the viewer (`{"models": [...]}`).
Snapshots include provenance and the demo flag. Reimporting a demo snapshot
preserves its warning; saved selections are restored when opening its HTML,
not when generating a new report from JSON.

This native example is **synthetic**; replace every value with a real export:

```json
[
  {
    "id": "example-stable-id",
    "slug": "example-model-high",
    "name": "Example Model (High Effort)",
    "provider": "anthropic",
    "series": "Example Model",
    "effort": "high",
    "release_date": "2026-09-01",
    "scores": {"deepswe": 73, "intelligence": 61},
    "cost_per_task": {"deepswe": 4.2},
    "total_benchmark_cost": {"deepswe": 420},
    "output_tokens_per_task": {"deepswe": 28000},
    "time_per_task": {"deepswe": 180},
    "pricing": {"input": 5, "output": 25, "blended": 10},
    "output_speed": 155
  }
]
```

Use stable source IDs when available; slugs identify URL selections and may
change upstream. Each record's slug must be unique. Records for the same base
model use the same `series` and different `effort` values. Specify `series`
explicitly when names are ambiguous or configurations should have separate
lines. By default, the generator uses the name before parentheses and separates
recognized fallback scenarios.

Lines connect effort variants in the order none, default, minimal, low,
medium, high, xhigh, max—not arbitrary different models. Unknown effort labels
are retained. A one-variant model is a single point. Deselecting a middle variant
joins the remaining selected variants directly; connecting lines are visual
guides, not interpolated measurements.

## Units

- Native `scores`: percentage benchmarks use 0–100; indices use their point
  values. Known fractional API evaluations such as GPQA are multiplied by 100.
  Unknown evaluation keys are retained as points without guessing their units.
- `cost_per_task`: USD per task for the same benchmark run. The Intelligence
  Index field is the source's weighted average across its evaluations, rounded
  to four decimal places. Preserve that precision in tooltips and exports.
- `total_benchmark_cost`: source-reported total USD for the benchmark run,
  retained in JSON separately from the weighted per-task average. Do not assume
  weighted task cost equals total cost divided by an unweighted task count.
- `output_tokens_per_task`: reported output tokens per benchmark task. Preserve
  the source's definition of whether reasoning tokens are included.
- `time_per_task`: reported or source-derived output-generation seconds per
  benchmark task. It is not end-to-end task latency.
- `pricing`: USD per million tokens, not benchmark task cost. `blended` is
  retained when supplied by a legacy/custom export; the current Free endpoint
  does not supply it. Its missing values remain absent.
- `output_speed`: median output tokens per second, read from the Free API's
  nested `performance.median_output_tokens_per_second` field.

The Free API does not expose benchmark token counts or per-task generation
time. Those selectors require a suitable imported export. It returns the
Intelligence Index version as major.minor, such as `4.3`, not the patch version;
retain that value in shared HTML/JSON and label the Intelligence Index axis.

Missing, empty, or null numeric values are absent. Numeric zero is retained.
Negative values, nonfinite numbers, duplicate slugs, and malformed inputs fail
with an error. The importer caps files and API responses at 20 MiB.

The percentage benchmark keys currently include `deepswe`, `gpqa`,
`mmlu_pro`, `hle`, `livecodebench`, `scicode`, `math_500`, and `aime`.
Native custom keys display as points. Normalize custom percentage units yourself
and make the unit explicit in the key; do not assume a fractional custom score
will be multiplied automatically.

## CSV

Canonical headers:

```csv
slug,name,provider,series,effort,benchmark,score,cost_per_task,output_tokens_per_task,time_per_task,price_input,price_output,price_blended,output_speed
example-model-high,Example Model,anthropic,Example Model,high,deepswe,73,4.2,28000,180,5,25,10,155
```

That row is synthetic. Percent suffixes (`73%`), dollar prefixes (`$4.20`),
and thousands separators are accepted. Quote values containing commas.
Common identity headings such as Model, Model Name, Slug, and Creator are
recognized case-insensitively. A missing slug is derived from the full model
name; prefer actual source slugs so bookmarks remain stable.

Scalar score/cost/token/time fields use the row's `benchmark`, or the
`--benchmark` argument when the row does not have one. Use JSON to retain
multiple benchmarks for the same slug. **Export chart CSV** includes selected
models, even if they are missing the plotted metric; its empty cells represent
missing values. Spreadsheet formula-like text cells are escaped with a leading
apostrophe. **Export all JSON** retains the entire model catalog.

## URL state and sharing

The primary query parameters are below. For the corrected default view, open
`$HOME/llm-stats.html` with `?benchmark=intelligence&x=cost`. Existing bookmarks
with `x=price` retain their explicit token-price selection; replace that value
with `x=cost` rather than expecting the new default to override URL state.

```text
?models=example-model-high,example-model-max&benchmark=deepswe&x=cost&highlight=example-model-high
```

- `models`: comma-separated slugs, across any providers. An empty value selects
  nothing. Unknown slugs produce a warning instead of silently choosing defaults.
- `benchmark`: score key.
- `x`: cost, tokens, time, price, or speed.
- `highlight`: pinned node's slug; it must be selected and have plotted data.

Explicit `benchmark`/`x` values take precedence over Artificial Analysis's
aliases. Without `x`, alias precedence is cost, token usage, speed:

```text
eval-cost=intelligence-vs-total-cost
eval-token-usage=score-vs-output-tokens-per-task
eval-speed=intelligence-vs-time-per-task
```

The cost/speed aliases imply the intelligence benchmark unless `benchmark`
is explicit. The token alias uses the chosen benchmark. Changing controls
updates the matching alias plus the primary parameters; unrelated query
parameters remain untouched. Copying the query from an Artificial Analysis
link only selects views: it does not fetch missing models or metrics.

URL state overrides the state embedded by **Save HTML view**, then the
generator's defaults. Reset defaults resets model selection only, retaining
the current benchmark and x metric. Named presets can change those metrics
when they specify them.

The generator atomically replaces `$HOME/llm-stats.html` after successful
rendering. Failed fetches or rendering leave the previous HTML intact; tests
use isolated output paths so they cannot overwrite a bookmarked report.
Bookmark the generated page with its current query parameters. Its home-directory
path survives system temporary-file cleanup.

Local query updates and reloads work in Chrome. A browser that blocks
`history.replaceState` on `file://` shows a message; **Save HTML view** still
preserves selection. A local URL is not a public link: share the HTML file
itself, or host it on a static web server if you want a public bookmark.

## Custom defaults

For an exact initial selection, populate `models` with source slugs. For
automatic family selection, leave it empty and change
`families_per_provider`. Wildcards and presets can avoid hard-coded model
versions:

```json
{
  "providers": ["anthropic", "openai", "google"],
  "model_patterns": ["claude-opus-*", "claude-sonnet-*", "gpt-*", "gemini-*"],
  "families_per_provider": 0,
  "benchmark": "intelligence",
  "x": "cost"
}
```

Pass a partial custom configuration with `--config /path/to/defaults.json`;
omitted fields inherit the bundled defaults. Named presets belong in a
`presets` array and accept the same selection fields plus `name`.

## Verification

```bash
make -C <skill-base-dir> check test
```

Browser tests use Google Chrome through Playwright's `chrome` channel, with
networking disabled. They cover hover/pin/toggle, fuzzy selection, empty and
unknown URL selections, metric changes, presets, saved HTML, exports, and
hostile model names. Generator tests use mocked API responses; a passing suite
does not prove a real API key's access or the coverage of the current upstream
catalog.
