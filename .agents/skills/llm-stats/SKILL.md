---
name: llm-stats
description: >-
  Build a shareable, offline HTML chart of Artificial Analysis model
  benchmarks, with a line per model family across effort levels and
  searchable model selection. Use when the user wants to compare LLM
  benchmark scores against cost, tokens, time, price, or speed.
disable-model-invocation: true
argument-hint: "[--demo | --input <CSV/JSON> | --refresh] [--benchmark <key>] [--x cost|tokens|time|price|speed]"
metadata:
  model-tier: trivial
---

# LLM stats

Generate one self-contained HTML file, with its data, CSS, JavaScript, and SVG
embedded, that charts benchmark scores against a chosen metric, one line per
model family through its effort levels. It works offline, with no server and
no credentials in the browser. Read [data.md](references/data.md) for API
limits, units, import formats, URL parameters, and the 1Password setup.

1. **Choose the source.**
   - `--demo --benchmark intelligence --x cost` gives a synthetic preview.
   - `--input <path>` imports a CSV or JSON export; read data.md first for
     unfamiliar columns.
   - Otherwise use the Artificial Analysis API through the report command.
     It reuses a 24-hour cache, then an environment key, then the 1Password
     item named in the `report` target of the [Makefile](Makefile). Keep key
     values out of chat, command arguments, and files. If authentication
     fails, keep the existing report and ask the user to sign in; use demo
     data only when the user asks for a preview.

   The default view is Intelligence Index score against its weighted
   benchmark cost per task. Those costs belong to that index alone, so a
   cost chart for DeepSWE or any other benchmark needs that benchmark's own
   export, and token prices never stand in for task costs. Done when the
   source is chosen.
2. **Run the report** from the skill's base directory:

   ```bash
   make -C <skill-base-dir> report ARGS="<arguments>"
   ```

   Use `make -C <skill-base-dir> preview` for a preview, and `--no-open` when
   opening a browser isn't appropriate. It atomically replaces
   `$HOME/llm-stats.html`, prints the path, and opens it; a failed run
   leaves the previous file intact. Read stderr for warnings. Done when it
   exits 0; a nonzero exit means nothing was updated, so report the failure.
3. **Report** the HTML path first, then any warnings. Say plainly when it's
   demo data, and for real data, whether it came from the API, the cache, or
   an import. Done when the path is reported.

**Defaults.** When the user wants persistent defaults, propose the change to
[defaults.json](defaults.json) and edit it only once they approve:

- `providers`: the initial provider filter (Anthropic, OpenAI, and Google by
  default); every imported model stays in the dropdown.
- `families_per_provider`: how many families per provider to show first,
  newest then highest-scoring, with every effort variant; `0` means all.
- `models`: explicit slugs, copied from the data, never invented. A nonempty
  list overrides the provider filter and family limit.
- `model_patterns`: `*` and `?` wildcards within the provider filter; a
  nonempty list bypasses the family limit.
- `presets`: named selections for the Preset menu, each able to set its own
  selection, `benchmark`, and `x`.

Keep API keys out of this file. URL parameters override a saved view, which
overrides these defaults.

**Sharing.** **Save HTML view** embeds the current selection, pinned node,
and Pareto checkbox state, since URL state doesn't travel with an emailed
file. Each run rewrites the same `$HOME/llm-stats.html`, so a bookmark with
query parameters keeps working; keep those parameters when updating one.
An old bookmark with
`x=price` still shows token prices; `x=cost` gives benchmark cost. The page
can also export all JSON or the chart's CSV.

**Page behaviour,** which the tests protect:

- Hovering or focusing an effort node highlights its family. The normal
  view dims other families; Pareto mode keeps frontier nodes vivid.
  Clicking or Enter/Space pins it, clicking another replaces the pin, and
  clicking it again, Escape, or **Clear highlight** releases it.
- The model dropdown has fuzzy search, checkboxes, Clear, Select matches,
  and Reset defaults, with arrow keys to move and Escape to close.
- Models missing the chosen score or metric are left out with a visible
  warning naming each one and what it lacks, updated as selections change.
  Zero is a value, not a gap.
- **Pareto line**, off by default, overlays the non-dominated trade-offs
  among selected, plotted models with a bright yellow line. It dims other
  nodes and family curves. Only frontier nodes respond to the mouse, with
  tighter hit areas; keyboard focus and pin remain available for every model.
  It updates with selection and metric changes, and survives bookmarks and
  saved HTML.
- Reports and exports keep the API's index version, and cost tooltips keep
  four decimal places.

**Data use.** Use the
[API documentation](https://artificialanalysis.ai/data-api/docs) and exports
the user is allowed to share, and keep Artificial Analysis's attribution and
data-use terms in shared files. Credentials stay in the generator's
environment, never in the HTML.

**Changing the generator.** After editing the script or the page, run
`make -C <skill-base-dir> check test`. It needs Python 3.10+, `uv`, pytest,
Playwright, and a local Google Chrome; browser tests run with networking off
and never read the real 1Password item.
