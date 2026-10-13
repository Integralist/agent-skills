---
name: talking-points
description: Rank recurring topics from your Slack messages, team channels, and DMs for a retro or 1:1.
disable-model-invocation: true
argument-hint: "[--edit] [--days N]"
metadata:
  model-tier: moderate
---

# Talking points

Search Slack for what you and your team keep raising, then print a
priority-ranked list of **talking points** in the terminal — each tagged for
a team retro or a private 1:1.

## Arguments

- `--edit` — update the saved settings, then stop.
- `--days N` — lookback window in days (default `14`).

## Settings file

Path: `${XDG_CONFIG_HOME:-$HOME/.config}/talking-points/config.json`.

```json
{
  "name": "Jane Doe",
  "slack_user_id": "U0123456789",
  "channels": [{ "name": "#team-chat", "id": "C0123456789" }],
  "teammates": [{ "name": "John Roe", "id": "U0987654321" }]
}
```

## Steps

1. **Check Slack access.** Confirm a Slack message-search tool is available
   (one that covers private channels and DMs, e.g.
   `slack_search_public_and_private`). Otherwise run one probe search
   (`filters: "after:<yesterday>"`, `limit: 1`). On either failure, print the
   matching line and stop:

   ```text
   talking-points: exiting — no Slack search tool in this session.
     Fix: install or enable a Slack MCP connector, then retry.
   talking-points: exiting — Slack search failed: <error summary>.
     Fix: re-authenticate the Slack connector, then retry.
   ```

   Done when the probe returns without error.
2. **Load settings.** Read the settings file. Skip to Step 3 when it parses,
   holds a non-empty `slack_user_id` and at least one channel, and `--edit` is
   absent. Otherwise:
   1. Ask for all three values in one message, as a numbered list; when
      editing, show each current value beside its item:
      1. Your name or Slack username.
      2. Team channels, comma-separated.
      3. Teammates you talk to directly, comma-separated (optional).
   2. Resolve all values in parallel: people with the Slack user-search tool,
      channels with the Slack channel-search tool. In one follow-up message,
      list any person matching several users (let the user pick) and any
      value that failed to resolve (ask again for those only).
   3. Show the resolved settings, confirm, then write the file (create the
      directory with `mkdir -p`; set file mode `600`).
   4. With `--edit`, print the saved path and stop.
3. **Search.** Compute `after:` as today minus `--days`. Run these searches in
   parallel, excluding bots, paging with `cursor` until results run out or 100
   messages per search:
   1. **Mine in team channels:** `from:<@ID> in:<#C1> in:<#C2> … after:DATE`.
   2. **Team channels:** `in:<#C1> in:<#C2> … after:DATE`.
   3. **My DMs:** `from:<@ID> after:DATE` with `channel_types: im,mpim`.
   4. **Teammate DMs:** one search per teammate (`with:` filters AND, not OR):
      `with:<@TEAMMATE> after:DATE` with `channel_types: im,mpim`.
   Read the full thread (`slack_read_thread` or equivalent) for any hit that
   is a thread reply or has replies — complaints usually live in the replies.
   Done when every search is exhausted or capped.
4. **Cluster into topics.** Group messages by subject (a project, system,
   process, person, or decision), not by channel. Score each topic:
   - **Frequency** — distinct messages and distinct days it appears.
   - **Intensity** — frustration, blockers, repeated asks, "again", "still".
     Weight the user's own messages highest: their repeated complaints are the
     strongest signal.
   - **Breadth** — distinct people raising it.
   - **Recency** — mentions in the last few days rank above older ones.
5. **Tag the audience.** `1:1` when the topic appears only in DMs, or concerns
   a named person's behaviour or performance; otherwise `retro`.
6. **Print the report** in chat, ranked highest score first, at most 10 topics:

   ```text
   Talking points — <start date> to <today> (<n> messages scanned)

   1. <Topic> [retro] — 9 msgs, 4 days, 3 people
      Signal: <one line: what keeps coming up and why it hurts>
      Raise as: <one line: question or proposal to bring>
   ```

   Close with one line naming the top `retro` topic and the top `1:1` topic.
   When nothing scores above noise, print
   `No recurring topics in the last <N> days.`

## Privacy

- The settings file is the only thing written to disk. Keep message content in
  the chat; never post, react, or save it elsewhere.
- Paraphrase other people's DM content; quote at most a short phrase of the
  user's own words as evidence.
- Replace any credential, token, or key found in a message with `[REDACTED]`
  and add one line telling the user to rotate it.
