---
name: model-stats
description: Chart AI model usage, cost, and effort from local coding-CLI logs as an HTML page.
disable-model-invocation: true
argument-hint: "[day|week|month|year|all]"
metadata:
  model-tier: trivial
---

# Model stats

Chart which providers, models, effort levels, harnesses, and projects consume your tokens and money. The data comes straight from the harnesses' own log files (Claude Code, Codex, pi, OpenCode, Gemini CLI, Copilot CLI); `scripts/report.py` documents each source.

## Steps

1. Pick the period from the argument. With no argument, use `all`. For any
   other argument, stop and list these five periods:

   - `day`: today.
   - `week`: last 7 days, including today.
   - `month`: current calendar month to date.
   - `year`: current calendar month and the previous 11 months.
   - `all`: full history.
2. Run the script from this skill's base directory:

   ```bash
   python3 <skill-base-dir>/scripts/report.py <period>
   ```

   It writes the page to a random `/tmp/model-stats-XXXXXX.html`, prints that path on stdout, and opens it in the browser. Stderr lines prefixed `model-stats:` are warnings (price-list fetch failed, unreadable log file, no usage in the period).
3. Reply with the printed path on line 1, then each warning as one bullet. Done when the path is reported.

## Maintenance

When a harness changes its log format, update its `load_*` function in
`scripts/report.py` and its test in `scripts/test_report.py`. For chart changes,
update `scripts/template.html` and `scripts/test_browser.py`. Run
`make -C <skill-base-dir> test`; the browser tests require Google Chrome.
