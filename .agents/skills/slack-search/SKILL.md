---
name: slack-search
description: Drive Fastly's Slack workspace via the Playwright MCP to run a search query or Slackbot prompt, authenticating through Okta SSO with Duo push when needed.
disable-model-invocation: true
user-invocable: true
argument-hint: A natural-language request (e.g. `find foo messages from @alice`, or `use slackbot to show my TODOs from #integralist-daily today`)
---

# slack-search

Drive a real browser via the Playwright MCP to act on Slack on the
user's behalf. The user describes what they want in plain English; the
skill decides whether to run a **Slack search** or to **ask Slackbot**,
constructs the appropriate query/prompt, and returns the result.

The browser profile is persisted on disk, so re-auth is only required
when Okta's session expires.

> [!IMPORTANT]
> This skill drives a real, headed browser session against Slack and
> Okta. It does not store, read, or type credentials — the user types
> their Okta password (typically via 1Password) and approves the Duo
> push themselves. The skill only navigates, observes, and clicks.

## Input

The skill argument is a natural-language request describing what the
user wants from Slack. If empty, ask the user for one before doing
anything else.

The user is not expected to know Slack's search modifier syntax. Treat
the request as intent, not as a literal query.

## Decide the mode

Pick one of two modes from the request:

- **`search` mode** — the user wants to find existing messages in the
  workspace. Trigger words: "find", "search", "look for", "messages
  about", "what did X say", "who mentioned", etc. Output goes to
  Slack's top search bar.
- **`slackbot` mode** — the user explicitly mentions Slackbot,
  Slackbot AI, `/ai`, "ask slackbot", "have slackbot ...", or asks for
  a summary/digest that only Slackbot can produce. Output goes into
  the **Slackbot DM** as a chat message.

If the request is ambiguous, ask the user which mode and stop until
they answer. Do not guess.

## Construct the query / prompt

### Search mode

Translate the request into Slack search syntax. Useful modifiers:

- `from:@username` — messages by a user.
- `to:@username` — DMs to a user.
- `in:#channel` or `in:@username` — restrict to a channel or DM.
- `with:@username` — conversations involving a user.
- `before:YYYY-MM-DD`, `after:YYYY-MM-DD`, `on:YYYY-MM-DD`,
  `during:today` / `during:yesterday` / `during:April`.
- `has:link`, `has:pin`, `has:reaction`, `hasmy:star`.
- Quoted phrases for exact matches: `"rate limiter"`.

Examples:

| User request | Constructed query |
| --- | --- |
| find foo messages from user X | `from:@X foo` |
| what did alice say about rate limiting last week | `from:@alice "rate limit" after:<7d-ago>` |
| links bob shared in #platform yesterday | `from:@bob in:#platform has:link during:yesterday` |
| my starred messages mentioning incident | `hasmy:star incident` |

Resolve relative dates against the current date the harness has
already injected into context — do not hard-code "today". If the
request is too vague to make a confident query, show the user the
query you intend to run and ask before submitting.

### Slackbot mode

Use the user's request verbatim (or lightly cleaned: drop the leading
"use slackbot to" / "ask slackbot to") as the chat message to send to
Slackbot. Do **not** rewrite the wording — Slackbot's AI features
parse natural language and the user's phrasing is the contract.

Examples:

| User request | Message sent to Slackbot |
| --- | --- |
| use slackbot to show my TODOs from my #integralist-daily channel for today | `show my TODOs from my #integralist-daily channel for today` |
| ask slackbot to summarise unreads in #platform | `summarise unreads in #platform` |

Before sending, show the user the exact message you'll post to
Slackbot and confirm — Slackbot DMs are visible only to the user, but
sent messages can't be silently retracted.

## Prerequisites

The Playwright MCP server must be configured in the user's
`~/.claude.json` with a persistent profile:

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
headed. The auth flow needs a visible window for the user to interact
with 1Password and Duo, so `--headless` must be **absent**.
`--user-data-dir` makes the Chromium profile persistent so cookies
survive across MCP restarts.

If the Playwright MCP tools are not available (no `playwright`
entry among the connected MCP servers), tell the user to restart
their agent / CLI and stop — this skill cannot proceed without them.

## Tool names

The Playwright MCP exposes its tools under the `mcp__playwright__`
prefix. The ones used here:

- `mcp__playwright__browser_navigate` — open a URL.
- `mcp__playwright__browser_snapshot` — capture an accessibility-tree
  snapshot of the current page (returns ref IDs for elements).
- `mcp__playwright__browser_click` — click an element by ref.
- `mcp__playwright__browser_type` — type into an input by ref.
- `mcp__playwright__browser_press_key` — press a single key (e.g.
  `Enter`).
- `mcp__playwright__browser_wait_for` — wait for text to appear or
  disappear, or for a fixed duration.
- `mcp__playwright__browser_close` — close the browser when done.

If the running MCP exposes tools under different names, take a fresh
snapshot first and adapt — never invent ref IDs.

## Algorithm

### 1. Open Slack

Navigate to `https://fastly.enterprise.slack.com/`. Take a snapshot.

Decide the page state from the snapshot:

- **Already authenticated** — the snapshot shows the Slack workspace
  UI (channel sidebar, message pane, search bar at top). Skip to
  step 3.
- **Slack sign-in landing page** — shows a "Sign in with SSO" or
  workspace picker. Click through to reach Okta.
- **Okta login page** — shows a username/password form on an
  `okta.com` or `fastly.okta.com` host. Continue with step 2.
- **Duo prompt** — shows "Send Push" or a Duo iframe. Continue with
  step 2 from the Duo sub-step.

### 2. Authenticate (only when needed)

Do not type credentials. Pause and tell the user:

> Browser is on the Okta login page. Use 1Password to fill your
> credentials and submit the form. I'll wait for the Duo prompt.

Then call `browser_wait_for` with text matching the Duo prompt (e.g.
`"Send Push"`, `"Duo"`, or `"Verify it's you"`). Once it appears, tell
the user:

> Approve the Duo push on your phone. I'll wait for Slack to load.

Call `browser_wait_for` with text that only appears once Slack has
loaded (e.g. the workspace name in the sidebar, or `"Threads"` /
`"Direct messages"` in the nav). Use a generous timeout (60s).

If the wait times out, take a snapshot, surface what page is currently
shown, and ask the user how to proceed. Do not retry silently.

### 3. Dispatch by mode

#### Search mode

Take a fresh snapshot to find the top search input. Slack labels it
something like `Search Fastly` (workspace name) — locate it by its
accessible name in the snapshot, not by guessing a CSS selector.

- Click the search input by its ref.
- Type the **constructed query** verbatim with `browser_type`.
- Press `Enter` with `browser_press_key`.
- Call `browser_wait_for` until the results pane renders (e.g. wait
  for text like `"Messages"` tab heading or `"No results"`).

Then jump to step 4 (extract results).

#### Slackbot mode

Open the Slackbot DM:

- Try keyboard shortcut: press `Cmd+K` (the quick switcher), type
  `Slackbot`, wait for the suggestion list, press `Enter`.
- Fallback: navigate to the Slackbot DM URL if visible in the snapshot
  sidebar.

Once the Slackbot conversation is open:

- Take a snapshot to locate the message composer.
- Click the composer ref, type the **constructed message** verbatim,
  press `Enter`.
- Wait for Slackbot's reply. Slackbot AI replies are not instant —
  call `browser_wait_for` watching for a new message authored by
  Slackbot **after** the one you sent. Use a generous timeout (60s).
  If a "Slackbot is thinking…" or typing indicator is visible, wait
  for it to disappear before snapshotting the reply.

Then jump to step 4 (extract results).

### 4. Extract results

Take a snapshot of the results pane (search) or the Slackbot reply
(slackbot). From the accessibility tree, extract:

**Search mode** — for each message hit:

- Channel or DM name.
- Author display name.
- Timestamp (as Slack renders it — relative or absolute).
- Message text (verbatim, including any inline emoji shortcodes).
- Permalink, if exposed in the snapshot. If not, omit — do not
  fabricate URLs.

**Slackbot mode** — the latest Slackbot message text (verbatim,
preserving any bullet/numbered formatting). If Slackbot quotes source
messages, include them as-rendered.

If the snapshot is too large or paginated, return only what's visible
and tell the user more may exist.

### 5. Report

**Search mode** — markdown list grouped by channel:

```txt
**#channel-name**
- @author · 2d ago — message text
- @author · 2026-04-12 — message text

**DM with @alice**
- @alice · 5h ago — message text
```

Include the constructed query at the top so the user can refine it.

**Slackbot mode** — print Slackbot's reply verbatim under a heading
that names the prompt that was sent:

```txt
**Slackbot — "<prompt>"**

<reply text>
```

If there are zero results / Slackbot returned no useful answer, say so
plainly.

### 6. Close

Call `mcp__playwright__browser_close` so the next invocation starts
clean. The on-disk profile in `--user-data-dir` keeps the Slack/Okta
cookies, so the next run skips auth.

## Failure modes

- **Playwright MCP not loaded** → instruct the user to restart Claude
  Code and stop.
- **Okta times out waiting for credentials/Duo** → surface the current
  page snapshot, ask the user, do not retry.
- **Slack shows a workspace picker** (the user belongs to multiple
  workspaces) → take a snapshot, ask the user which workspace, then
  click that entry.
- **Search returns an error banner** ("Something went wrong") →
  surface verbatim. Do not retry.
- **Slackbot reply never arrives within timeout** → surface the
  current Slackbot pane state, ask the user, do not retry silently.
- **Snapshot extraction is ambiguous** (no clear message blocks) →
  tell the user the pane couldn't be parsed and offer to leave the
  browser open so they can read it directly.

## Notes

- Never store, log, or echo the user's password or any session cookie.
- Slack's DOM and accessibility tree change without notice. Prefer
  snapshot-driven ref lookups over hard-coded selectors so the skill
  degrades gracefully when labels shift.
- The persistent profile lives at
  `/Users/mmcdonnell/.playwright-mcp-data`. Deleting it forces a full
  re-auth on the next run.
- Slackbot mode posts a message under the user's account. Always
  confirm the constructed prompt with the user before sending.
