---
name: llm-stats
description: >-
  Build shareable, offline HTML charts from Artificial Analysis model benchmarks,
  with effort-level lines and searchable model selection.
disable-model-invocation: true
argument-hint: "[--demo | --input <CSV/JSON> | --refresh] [--benchmark <key>] [--x cost|tokens|time|price|speed]"
---

# LLM stats

Compare benchmark scores and effort levels with bright, distinct model lines
on dark warm-brown surfaces with cream text and terracotta accents. Each report
is one HTML file with its data, CSS, JavaScript, and SVG embedded. It works
offline without a server or browser-side credentials.

## Steps

1. Choose the source from the user's arguments:
   - Use `--demo --benchmark intelligence --x cost` for a synthetic preview.
   - Use `--input <path>` for a CSV/JSON export. Read
     [data formats](references/data.md) before importing unfamiliar columns.
   - Otherwise use the official Artificial Analysis API via the configured
     report command below. It reuses the 24-hour cache, then prefers an
     environment key, then reads the configured 1Password item using an explicit
     personal account. Keep key values out of chat, command arguments, and files.
     If authentication fails, preserve the existing report and ask the user to
     sign in; use demo values only when the user requests a preview.
   - Default to Intelligence Index score versus its reported weighted benchmark
     cost per task. Fetch every page of `/api/v2/language/models/free`; the
     complete catalog is cached for 24 hours. A legacy endpoint cache is
     refreshed once automatically. For DeepSWE or another benchmark's cost
     chart, require the matching export; Intelligence Index costs belong only
     to that index. Keep token prices separate from actual benchmark costs.

2. Run the configured report command from this skill's base directory:

   ```bash
   make -C <skill-base-dir> report ARGS="<arguments>"
   ```

   The account and secret reference live in the `report` target in
   [Makefile](Makefile); no secret value is stored there. For a preview, run
   `make -C <skill-base-dir> preview` instead.

   It atomically replaces `/tmp/llm-stats.html`, prints that path on stdout,
   and opens it in the browser. The previous HTML remains intact if generation
   fails. Use `--no-open` when opening a browser is inappropriate. Read stderr
   for warnings; a nonzero exit means generation failed and no successful
   update should be reported.

3. Report the HTML path first, followed by any warning. Identify demo data
   explicitly. For real data, state whether it came from the API/cache or an
   imported export. Done when the file exists and its path is reported.

## Defaults and saved views

Edit [defaults.json](defaults.json) when the user requests persistent defaults.
Propose the change and get approval before editing.

- `providers`: initial provider filter; bundled values are Anthropic, OpenAI,
  and Google. Every imported model remains available in the dropdown.
- `families_per_provider`: number of initial model families per provider,
  ordered by release date then intelligence score. `0` means all families.
  Include every effort variant in each selected family.
- `models`: explicit model slugs; a nonempty list overrides provider filters
  and family limits. Copy real slugs from the data rather than inventing them.
- `model_patterns`: wildcard slugs (`*` and `?`) within the provider filter.
  A nonempty list bypasses the family limit.
- `presets`: named selections for the Preset menu. Each preset can override
  selection defaults, `benchmark`, and `x`. Keep API keys out of this file.

URL parameters override a saved HTML view, which overrides these defaults.
The page updates `models`, `benchmark`, `x`, and `highlight` as controls change;
`models=` intentionally selects nothing. It also accepts the Artificial
Analysis `eval-cost`, `eval-token-usage`, and `eval-speed` aliases described in
[data formats](references/data.md).

Use **Save HTML view** to share the current selection and pinned node with
someone else. URL state alone does not travel with an email attachment.
Bookmark `file:///tmp/llm-stats.html` with the desired query parameters. Each
successful run updates the data at that same path. The system may clear `/tmp`;
rerun the skill to recreate it. Export all JSON or chart CSV to reuse the data
in another graphing tool.

## Interactions

Hovering or keyboard-focusing an effort node highlights its model-family line
and dims other lines. Clicking or pressing Enter/Space pins the node. Hovering
another node leaves a pin unchanged; clicking another replaces it. Clicking the
same pinned node restores every line immediately. Escape or **Clear highlight**
also releases it.

The model dropdown supports fuzzy search, checkboxes, Clear, Select matches,
and Reset defaults. Arrow keys move between results; Escape closes the menu.
Models missing the chosen score or x metric are omitted with a visible warning
that lists each model's name and exactly which measurement is missing. Update
the list when selections or metrics change. Zero is valid, not missing data. Preserve the API's index version
in reports and exports. Cost tooltips retain the reported four-decimal precision.
An old bookmark with `x=price` still requests token pricing; use `x=cost` for the
corrected benchmark-cost view.

## Data access and maintenance

Use the [current API documentation](https://artificialanalysis.ai/data-api/docs)
and user-supplied exports. Retain Artificial Analysis attribution and data-use
terms in shared files. Keep credentials in the generator's environment, never
in HTML. Read [data formats](references/data.md) for API limits, units, imports,
and reproducible examples. Use only data the user is allowed to share.

Run the deterministic tests after changing the script or interactions:

```bash
make -C <skill-base-dir> check test
```

The generator requires Python 3.10+. The configured live command also uses the
1Password CLI when the cache has expired and no environment key is set. Tests
use `uv`, pytest, Playwright, and a locally installed Google Chrome; browser
tests disable networking and never read the real 1Password item.
