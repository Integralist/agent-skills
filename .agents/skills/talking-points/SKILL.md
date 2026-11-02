---
name: talking-points
description: >-
  Rank the topics you and your team keep raising in Slack messages, team
  channels, and DMs. Use when preparing for a team retro or a 1:1.
disable-model-invocation: true
argument-hint: "[--edit] [--days N]"
metadata:
  model-tier: moderate
---

Print the report in chat. `--days N` sets lookback (default: 14 days).

**Settings:** `${XDG_CONFIG_HOME:-$HOME/.config}/talking-points/config.json`.

**Privacy:** Write only this settings file; keep message content in chat.
Never post, react to, or save it elsewhere. Paraphrase others' DMs; quote at
most a short phrase of the user's own words. Redact credentials, tokens, or
keys as `[REDACTED]` and tell the user to rotate them.

Read [SLACK-WORKFLOW.md](references/SLACK-WORKFLOW.md) before Slack access,
settings, search, or ranking.

1. **Check Slack access.** Confirm a search tool covers private channels and
   DMs (e.g. `slack_search_public_and_private`) and probe once with
   `filters: "after:<yesterday>"`, `limit: 1`. If unavailable, print the first
   message and stop; on failure, print the second with error summary and
   stop:

   ```text
   talking-points: exiting — no Slack search tool in this session.
     Fix: install or enable a Slack MCP connector, then retry.
   talking-points: exiting — Slack search failed: <error summary>.
     Fix: re-authenticate the Slack connector, then retry.
   ```

2. **Load or edit settings.** Use settings without prompting if the file
   parses, has a non-empty `slack_user_id`, at least one channel, and no
   `--edit`. Otherwise follow the reference. With `--edit`, save confirmed
   settings, print the saved path, and stop.
