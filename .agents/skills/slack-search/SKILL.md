---
name: slack-search
description: Drive Fastly's Slack workspace via the Playwright MCP to run a search query or Slackbot prompt, authenticating through Okta SSO with Duo push when needed.
disable-model-invocation: true
argument-hint: A natural-language request (e.g. `find foo messages from @alice`, or `use slackbot to show my TODOs from #integralist-daily today`)
---

# slack-search

Drive a real headed browser via the Playwright MCP to act on Slack for
the user. From a plain-English request, decide whether to run a **Slack
search** or **ask Slackbot**, construct the query/prompt, and return the
result. The browser profile persists on disk, so re-auth is only needed
when Okta's session expires.

> [!IMPORTANT]
> This skill never stores, reads, or types credentials. The user types
> their Okta password (via 1Password) and approves the Duo push
> themselves. The skill only navigates, observes, and clicks.

## Input

The argument is a natural-language request. If empty, ask for one before
doing anything. Treat it as intent, not a literal query — the user is
not expected to know Slack's search syntax.

## Decide the mode

- **`search`** — find existing messages. Triggers: "find", "search",
  "look for", "messages about", "what did X say", "who mentioned".
  Output goes to Slack's top search bar.
- **`slackbot`** — the request mentions Slackbot, Slackbot AI, `/ai`,
  "ask slackbot", "have slackbot ...", or asks for a summary/digest only
  Slackbot can produce. Output goes into the **Slackbot DM**.

If ambiguous, ask which mode and stop. Do not guess.

## Construct the query / prompt

### Search mode

Translate the request into Slack search syntax. Modifiers:

- `from:@username` — messages by a user.
- `to:@username` — DMs to a user.
- `in:#channel` / `in:@username` — restrict to a channel or DM.
- `with:@username` — conversations involving a user.
- `before:YYYY-MM-DD`, `after:YYYY-MM-DD`, `on:YYYY-MM-DD`,
  `during:today` / `during:yesterday` / `during:April`.
- `has:link`, `has:pin`, `has:reaction`, `hasmy:star`.
- Quoted phrases for exact matches: `"rate limiter"`.

| User request                                     | Constructed query                                  |
| ------------------------------------------------ | -------------------------------------------------- |
| find foo messages from user X                    | `from:@X foo`                                      |
| what did alice say about rate limiting last week | `from:@alice "rate limit" after:<7d-ago>`          |
| links bob shared in #platform yesterday          | `from:@bob in:#platform has:link during:yesterday` |
| my starred messages mentioning incident          | `hasmy:star incident`                              |

Resolve relative dates against the current date already in context — do
not hard-code "today". If the request is too vague for a confident
query, show the query you intend to run and ask before submitting.

### Slackbot mode

Send the request verbatim (only drop a leading "use slackbot to" / "ask
slackbot to"). Do **not** rewrite the wording — Slackbot's AI parses
natural language and the user's phrasing is the contract.

| User request                                                               | Message sent to Slackbot                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| use slackbot to show my TODOs from my #integralist-daily channel for today | `show my TODOs from my #integralist-daily channel for today` |
| ask slackbot to summarise unreads in #platform                             | `summarise unreads in #platform`                             |

Show the exact message you'll post and confirm before sending — sent
messages can't be silently retracted.

## Prerequisites

The Playwright MCP server must be configured in `~/.claude.json` with a
persistent profile:

```json
{
  "playwright": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "@playwright/mcp@latest",
      "--user-data-dir",
      "/Users/mmcdonnell/.playwright-mcp-data"
    ]
  }
}
```

`--headless` is a boolean toggle: present means headless, absent means
headed. The auth flow needs a visible window for 1Password and Duo, so
`--headless` must be **absent**. `--user-data-dir` makes the Chromium
profile persistent so cookies survive MCP restarts.

If the Playwright MCP tools are unavailable (no `playwright` entry among
connected MCP servers), tell the user to restart their agent/CLI and
stop — the skill cannot proceed without them.

## Tool names

The tools are prefixed `mcp__playwright__`:

- `browser_navigate` — open a URL.
- `browser_snapshot` — accessibility-tree snapshot (returns ref IDs).
- `browser_click` — click an element by ref.
- `browser_type` — type into an input by ref.
- `browser_press_key` — press a single key (e.g. `Enter`).
- `browser_wait_for` — wait for text to appear/disappear or a duration.
- `browser_close` — close the browser when done.

If the running MCP exposes different names, snapshot first and adapt —
never invent ref IDs.

## Algorithm

### 1. Open Slack

Navigate to `https://fastly.enterprise.slack.com/` and snapshot. Decide
the page state:

- **Authenticated** — workspace UI (sidebar, message pane, search bar).
  Skip to step 3.
- **Slack sign-in landing** — "Sign in with SSO" or workspace picker.
  Click through to Okta.
- **Okta login** — username/password form on an `okta.com` /
  `fastly.okta.com` host. Go to step 2.
- **Duo prompt** — "Send Push" or a Duo iframe. Go to step 2's Duo
  sub-step.

### 2. Authenticate (only when needed)

Do not type credentials. Pause and tell the user:

> Browser is on the Okta login page. Use 1Password to fill your
> credentials and submit the form. I'll wait for the Duo prompt.

Call `browser_wait_for` on Duo-prompt text (e.g. `"Send Push"`,
`"Duo"`, `"Verify it's you"`). Once it appears, tell the user:

> Approve the Duo push on your phone. I'll wait for Slack to load.

Call `browser_wait_for` on text that only appears once Slack loads (the
workspace name in the sidebar, or `"Threads"` / `"Direct messages"`).
Use a generous 60s timeout. On timeout, snapshot, surface the current
page, and ask the user — do not retry silently.

### 3. Dispatch by mode

**Search mode:** snapshot to find the top search input (labelled like
`Search Fastly`); locate it by accessible name, not a guessed CSS
selector. Click it by ref, type the constructed query verbatim with
`browser_type`, press `Enter`, then `browser_wait_for` the results pane
(e.g. `"Messages"` tab heading or `"No results"`). Go to step 4.

**Slackbot mode:** open the Slackbot DM — press `Cmd+K`, type
`Slackbot`, wait for the suggestion list, press `Enter`; fallback:
navigate to the Slackbot DM URL if visible in the sidebar. Snapshot to
locate the composer, click it, type the constructed message verbatim,
press `Enter`. Wait for Slackbot's reply (not instant): `browser_wait_for`
a new Slackbot-authored message **after** the one you sent, 60s timeout;
if a "Slackbot is thinking…" / typing indicator shows, wait for it to
disappear before snapshotting. Go to step 4.

### 4. Extract results

Snapshot the results pane (search) or Slackbot reply. From the
accessibility tree:

- **Search** — per hit: channel/DM name, author display name, timestamp
  as rendered, message text verbatim (incl. inline emoji shortcodes),
  and permalink if exposed (omit if not — do not fabricate URLs).
- **Slackbot** — the latest Slackbot message text verbatim, preserving
  bullet/numbered formatting; include any quoted source messages
  as-rendered.

If the snapshot is too large or paginated, return only what's visible
and warn that more may exist.

### 5. Report

**Search** — markdown list grouped by channel, with the constructed
query at the top so the user can refine it:

```txt
**#channel-name**
- @author · 2d ago — message text
- @author · 2026-04-12 — message text

**DM with @alice**
- @alice · 5h ago — message text
```

**Slackbot** — the reply verbatim under a heading naming the prompt:

```txt
**Slackbot — "<prompt>"**

<reply text>
```

If there are zero results / no useful answer, say so plainly.

### 6. Close

Call `mcp__playwright__browser_close` so the next run starts clean. The
on-disk profile keeps the Slack/Okta cookies, so the next run skips
auth.

## Failure modes

- **Playwright MCP not loaded** → tell the user to restart Claude Code
  and stop.
- **Okta times out waiting for credentials/Duo** → surface the page
  snapshot, ask the user, do not retry.
- **Workspace picker** (user belongs to multiple workspaces) → snapshot,
  ask which workspace, click that entry.
- **Search error banner** ("Something went wrong") → surface verbatim.
  Do not retry.
- **Slackbot reply never arrives within timeout** → surface the Slackbot
  pane state, ask the user, do not retry silently.
- **Snapshot extraction ambiguous** (no clear message blocks) → tell the
  user the pane couldn't be parsed and offer to leave the browser open
  for them to read directly.

## Notes

- Never store, log, or echo the user's password or any session cookie.
- Slack's DOM and accessibility tree change without notice. Prefer
  snapshot-driven ref lookups over hard-coded selectors.
- The persistent profile lives at
  `/Users/mmcdonnell/.playwright-mcp-data`. Deleting it forces a full
  re-auth on the next run.
- Slackbot mode posts under the user's account. Always confirm the
  constructed prompt before sending.
