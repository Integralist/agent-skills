---
name: today
description: Show an emoji-rich terminal briefing for today — TODO list from the personal "TODO" Google Doc, today's Google Calendar meetings, and starred Gmail messages in the inbox.
---

# today

Render a daily briefing in the terminal. Three sections, each with a
leading emoji. The user has explicitly opted in to emoji output for
this skill.

1. ✅ **TODO** — current contents of the user's `TODO` Google Doc.
1. 📅 **Calendar** — today's accepted/tentative meetings, full day,
   local timezone.
1. ⭐ **Starred mail** — starred messages currently in the inbox.

This skill is **read-only**. It never writes to the doc, calendar, or
mail.

## 1. ✅ TODO list

Follow the **`find-todo-doc`** skill to get the `documentId`.

- If `status: not-found` → render the section as `_(no TODO doc
  found — run /slack-to-todo to create one)_` and continue with the
  rest of the briefing.
- If `status: found` → call
  `mcp__plugin_google-workspace_google-workspace__docs_getText` with
  the `documentId` and render the body verbatim under a `## ✅ TODO`
  heading. The doc already contains plain-text bullets (`- item` /
  `  - sub`) written by `slack-to-todo`; markdown rendering in the
  terminal will display them as a proper bullet list. Preserve any
  emojis already in the TODO content.

## 2. 📅 Calendar — today's meetings

Determine today's date in the user's local timezone (use
`mcp__plugin_google-workspace_google-workspace__time_getCurrentDate`
and `time_getTimeZone` if needed). Build a UTC-isoformat range covering
00:00 to 23:59:59 local.

Call `mcp__plugin_google-workspace_google-workspace__calendar_listEvents`
on the primary calendar with that range.

Filter the response:

- **Drop declined events.** Keep `accepted`, `tentative`, and events
  with no explicit RSVP (the user often hasn't replied).
- Keep all-day events; mark them as such.
- Sort by start time.

Render under a `## 📅 Calendar` heading as a markdown list. Each row:

- Leading time emoji: 🕐 for timed meetings, 🌅 for all-day.
- `HH:MM–HH:MM` (24-hour, local) or `all-day`.
- Title.
- RSVP marker if not `accepted`: `❓` for tentative, `❔` for
  no-response.
- One short location/conferencing hint (📹 for Meet/video, 📍 for
  physical room) if present. Keep it short — no full URLs unless
  that's the only locator.

If the day has zero events, render `_(no meetings today 🎉)_`.

## 3. ⭐ Starred mail

Call `mcp__plugin_google-workspace_google-workspace__gmail_search` with
query `is:starred in:inbox`.

For each result, call
`mcp__plugin_google-workspace_google-workspace__gmail_get` with
`format: "metadata"` to get sender, subject, date, and `threadId`.

Render under a `## ⭐ Starred mail` heading as a list. Each row:

- 📧 prefix.
- Sender name only (strip the address).
- Subject **as a markdown link** to the Gmail thread, using the URL
  pattern `https://mail.google.com/mail/u/0/#inbox/<threadId>`. Note:
  the `u/0` account-index segment is correct only if the user has a
  single Gmail signed in or this is their primary account. There is
  no API to discover the right index — this is best-effort.
- Short relative age — `🕐 2d`, `🕐 5h`.

If zero results, render `_(no starred mail in inbox)_`.

## Output shape

Single markdown response. Top-level heading `# 📋 Today — <YYYY-MM-DD>`
followed by the three sections in the order above. Keep prose minimal
— this is a glanceable briefing, not a report. Emojis are decorative
markers; do not let them push the content off the screen on narrow
terminals (one emoji per line max for list items).

## Failure modes

- Any individual section that errors → render the heading with
  `⚠️ _(error: <message>)_` and continue with the other sections. A
  failure in one source must not block the rest of the briefing.
- Auth not configured for one of the surfaces → surface the specific
  error from the MCP verbatim under that section.
