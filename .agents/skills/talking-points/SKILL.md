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

# Talking Points

Search Slack for what you and your team keep raising, then print a ranked list
of talking points in chat, each tagged for a team retro or a private 1:1.
`--days N` sets the lookback window (default 14); `--edit` updates the saved
settings and stops.

**Settings** live in `${XDG_CONFIG_HOME:-$HOME/.config}/talking-points/config.json`:

```json
{
  "name": "Jane Doe",
  "slack_user_id": "U0123456789",
  "channels": [{ "name": "#team-chat", "id": "C0123456789" }],
  "teammates": [{ "name": "John Roe", "id": "U0987654321" }]
}
```

**Privacy.** The settings file is the only thing written to disk; message
content stays in chat, never posted, reacted to, or saved elsewhere.
Paraphrase other people's DMs, and quote at most a short phrase of the user's
own words as evidence. Replace any credential, token, or key in a message with
`[REDACTED]` and add one line telling the user to rotate it.

1. **Check Slack access.** Confirm a message-search tool that covers private
   channels and DMs is available (such as `slack_search_public_and_private`),
   and run one probe search (`filters: "after:<yesterday>"`, `limit: 1`). On
   failure, print the matching line and stop:

   ```text
   talking-points: exiting — no Slack search tool in this session.
     Fix: install or enable a Slack MCP connector, then retry.
   talking-points: exiting — Slack search failed: <error summary>.
     Fix: re-authenticate the Slack connector, then retry.
   ```

   Done when the probe returns without error.
2. **Load settings.** Go straight to step 3 when the file parses, has a
   non-empty `slack_user_id` and at least one channel, and `--edit` is absent.
   Otherwise:
   1. Ask in one message, as a numbered list, for the user's name or Slack
      username, their team channels, and the teammates they talk to directly
      (optional), showing current values when editing.
   2. Resolve people with the Slack user search and channels with the channel
      search, in parallel. In one follow-up, let the user pick among multiple
      matches and re-ask only for values that didn't resolve.
   3. Show the resolved settings, confirm, and write the file with
      `mkdir -p` for the directory and mode `600`.
   4. With `--edit`, print the saved path and stop.

   Done when valid settings are loaded.
3. **Search** from `after:` = today minus `--days`, running these in parallel,
   excluding bots, and paging with `cursor` to the end or 100 messages each:
   - **Mine in team channels:** `from:<@ID> in:<#C1> in:<#C2> … after:DATE`.
   - **Team channels:** `in:<#C1> in:<#C2> … after:DATE`.
   - **My DMs:** `from:<@ID> after:DATE` with `channel_types: im,mpim`.
   - **Teammate DMs:** one `with:<@TEAMMATE> after:DATE` search per teammate,
     with `channel_types: im,mpim`, since `with:` filters AND rather than OR.

   Read the whole thread for any hit that's a reply or has replies, since
   complaints usually live there. Done when every search is exhausted or
   capped.
4. **Cluster and score.** Group messages by subject (a project, system,
   process, person, or decision), not by channel, and score each topic on
   frequency (distinct messages and days), intensity (frustration, blockers,
   repeated asks, "again", "still", weighting the user's own messages
   highest), breadth (distinct people), and recency. Tag it `1:1` when it
   appears only in DMs or concerns a named person's behaviour or performance,
   and `retro` otherwise. Done when every topic has a score and a tag.
5. **Print the report,** highest score first, ten topics at most, closing with
   one line naming the top `retro` and top `1:1` topic. When nothing rises
   above noise, print `No recurring topics in the last <N> days.` Done when
   the report is printed.

   ```text
   Talking points — <start date> to <today> (<n> messages scanned)

   1. <Topic> [retro] — 9 msgs, 4 days, 3 people
      Signal: <one line: what keeps coming up and why it hurts>
      Raise as: <one line: question or proposal to bring>
   ```
