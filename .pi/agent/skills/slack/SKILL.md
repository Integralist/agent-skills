---
name: slack
description: >-
  Send, edit, and delete Slack messages in Pi without the "Sent using @Claude"
  attribution footer. Use when posting, updating, or deleting Slack messages, or
  when interacting with Slack via mcp__slack in Pi.
metadata:
  model-tier: trivial
---

Search, read, and post to Fastly Slack in Pi through `mcp__slack` while keeping
posted messages free of the `*Sent using* <@Claude>` footer that Slack's hosted
MCP endpoint appends.

**Read and search.** Call `mcp__slack` tools in `codemode` (`slack_search_channels`,
`slack_search_public_and_private`, `slack_read_channel`, `slack_read_thread`,
`slack_read_user_profile`, `slack_send_message_draft`).

**Send without attribution.** `mcp__slack__slack_send_message` converts Markdown
tables, lists, and code blocks into Slack `rich_text` blocks, but appends a
trailing `context` block (`*Sent using* <@U0BEY622J01>`). Strip that block
immediately after sending:

1. Call `mcp__slack__slack_send_message` and capture `channel_id` and
   `message_ts` from its response. Done when the message is posted.
2. Rewrite the message without the `context` block using the OAuth user token in
   `~/.pi/agent/mcp-auth.json`:

```bash
token=$(jq -r '.. | objects | .access_token? // empty | select(startswith("xox"))' ~/.pi/agent/mcp-auth.json | head -n1)
msg=$(curl -fsSL -H "Authorization: Bearer $token" "https://slack.com/api/conversations.history?channel=$CHANNEL_ID&latest=$MESSAGE_TS&inclusive=true&limit=1")
body=$(jq -n --arg ch "$CHANNEL_ID" --arg ts "$MESSAGE_TS" --argjson m "$msg" '{channel: $ch, ts: $ts, text: $m.messages[0].text, blocks: ($m.messages[0].blocks | map(select(.type != "context")))}')
curl -fsSL -H "Authorization: Bearer $token" -H "Content-Type: application/json; charset=utf-8" -d "$body" https://slack.com/api/chat.update
```

Done when `chat.update` returns `"ok": true`.

**Delete a message.** `mcp__slack` has no delete tool; call `chat.delete` with
the same token:

```bash
token=$(jq -r '.. | objects | .access_token? // empty | select(startswith("xox"))' ~/.pi/agent/mcp-auth.json | head -n1)
curl -fsSL -H "Authorization: Bearer $token" -H "Content-Type: application/json; charset=utf-8" -d "{\"channel\":\"$CHANNEL_ID\",\"ts\":\"$MESSAGE_TS\"}" https://slack.com/api/chat.delete
```
