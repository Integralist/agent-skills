---
name: model-stats
description: >-
  Chart AI model usage, cost, and effort from local coding-CLI logs as an HTML
  page. Use when the user wants to see which providers, models, harnesses, or
  projects use their tokens and money over a period.
disable-model-invocation: true
argument-hint: "[day|week|month|year|all]"
metadata:
  model-tier: trivial
---

# Model stats

Chart which providers, models, effort levels, harnesses, and projects use the
user's tokens and money, read straight from each harness's own logs (Claude
Code, Codex, pi, OpenCode, Gemini CLI, Copilot CLI). `scripts/report.py`
documents each source.

1. **Pick the period** from the argument, `all` when there's none. For any
   other value, stop and list the five periods: `day` (today), `week` (the
   last 7 days, including today), `month` (this calendar month to date),
   `year` (this calendar month and the 11 before it), and `all` (full
   history). Done when the period is valid.
2. **Run the script** from the skill's base directory:

   ```bash
   python3 <skill-base-dir>/scripts/report.py <period>
   ```

   It writes a random `/tmp/model-stats-XXXXXX.html`, prints the path, and
   opens it. Stderr lines starting `model-stats:` are warnings, such as a
   failed price-list fetch, an unreadable log, or no usage in the period.
   Done when it prints the path.
3. **Reply** with the path on line 1 and each warning as a bullet. Done when
   the path is reported.

**Maintenance.** When a harness changes its log format, update its `load_*`
function in `scripts/report.py` and its test in `scripts/test_report.py`. For
chart changes, update `scripts/template.html` and `scripts/test_browser.py`.
Then run `make -C <skill-base-dir> test`; the browser tests need Google
Chrome.
