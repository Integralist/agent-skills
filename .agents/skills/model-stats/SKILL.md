---
name: model-stats
description: >-
  Chart AI model usage, cost, and effort from local coding-CLI logs as an HTML
  page. Use when the user wants to see which providers, models, harnesses, or
  projects use their tokens and money over a period.
disable-model-invocation: true
argument-hint: "[day|week|month|year|all] [--theme anthropic|fastly]"
metadata:
  model-tier: trivial
---

Chart token use, cost, and effort by provider, model, harness, and project
from local logs for Claude Code, Codex, pi, OpenCode, Gemini CLI, and Copilot
CLI. The source formats are documented in `scripts/report.py`.

1. **Choose a time range.** Use the argument, or `month` when none is given.
   Accept only `day` (today), `week` (the last 7 days, including today),
   `month` (to date; this calendar month through today), `year` (this
   calendar month and the 11 before it), or `all` (full history). For any
   other value, stop and list the five valid choices.
2. **Generate the chart.** From this skill's base directory, run:

   ```bash
   python3 <skill-base-dir>/scripts/report.py <period>
   ```

   It writes a randomly named `/tmp/model-stats-XXXXXX.html`, prints its
   path, and opens it. Anthropic-inspired is the default; add `--theme fastly`
   only when requested. Every page includes a System / Light / Dark control.
   Stderr lines beginning `model-stats:` are warnings,
   including an unsuccessful price-list fetch, unreadable log, or no usage in
   the time range.
3. **Reply with the result.** Put the path on line 1 and list each warning as
   a bullet.

**Maintenance.** When a harness changes its log format, update its `load_*`
function in `scripts/report.py` and its test in `scripts/test_report.py`. For
chart changes, first load [design](../design/SKILL.md) and its selected
theme and HTML guidance. The generator embeds shared design assets; keep
only chart layout and behaviour in `scripts/template.html` and update
`scripts/test_browser.py`.
Run `make -C <skill-base-dir> test`; browser tests require Google Chrome.
