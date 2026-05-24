---
name: slack-to-todo
description: Parse a pasted Slack message and replace the contents of a personal "TODO" Google Doc with its :to-do: items as nested plain-text bullets, creating the doc if it doesn't exist.
argument-hint: The Slack message text to extract TODOs from
---

# slack-to-todo

Capture `:to-do:` lines from a pasted Slack message and **replace** the
full contents of the user's personal `TODO` Google Doc with them as
nested bullets.

> [!IMPORTANT]
> Storage is a Google **Doc**, not Google Keep or Google Tasks — neither
> is reachable via the `google-workspace` MCP. Bullets are written as
> **plain text** (`- item` / `  - sub`), not native Docs bullet
> formatting; the MCP does not expose `createParagraphBullets`.

> [!WARNING]
> This skill **replaces** the entire contents of the `TODO` doc on every
> run. Anything already in the doc — including TODOs added manually or
> from a prior run — is overwritten. The confirmation step exists in
> part to prevent accidental data loss.

## Input

The skill argument is the raw Slack message text. If empty, ask the user
to paste it before doing anything else.

## Parsing rule

Build a section → TODO tree from the pasted text.

1. Split into lines, trim each, drop blank lines.
1. A line is a **TODO** if it begins with `:to-do:`. Strip that prefix
   plus surrounding whitespace; the remainder is the TODO content. Keep
   any other emojis (`:ahh:`, `:white_check_mark:`, etc.) verbatim.
1. A line is a **section header** if it is not a TODO *and* the next
   non-blank line is a TODO. Keep trailing punctuation as written
   (`Miscellaneous.` stays `Miscellaneous.`).
1. Discard everything else — context, narrative, links, banners like
   `:white_check_mark: TODAY`, meeting times. The user wants TODOs only.
1. TODOs that appear before any header become top-level bullets with no
   parent.
1. Drop sections that end up with zero TODOs.

If no `:to-do:` lines are found, tell the user nothing was parseable and
stop — do not call any Drive or Docs tool.

## Confirmation step (mandatory)

Before any Drive/Docs call, print:

1. The exact bullet block that will be written.
1. A reminder that this **replaces** the existing doc contents.

Then ask the user to confirm. Header detection is heuristic and the
write is destructive — the user must be able to abort.

Format:

```txt
- Domainr
  - Re-review a couple of Eric's PRs.
- Ascerta
  - Review and possibly implement PKI Validation 01 (PR).
- Blue Ribbon
  - Add state filter + update docs/schemas (thread).
  - Continue implementing.
```

Two-space indent per nesting level.

## Locate the TODO doc

Follow the **`find-todo-doc`** skill to obtain the `documentId`. It
handles the `drive_search` query, the `'me' in owners` filter, and
multi-match disambiguation.

- If `find-todo-doc` reports `status: not-found` → call
  `mcp__plugin_google-workspace_google-workspace__docs_create` with
  `title: "TODO"`. Capture the returned `documentId`. Treat the doc
  as empty (skip the `getText`/`replaceText` path; go straight to the
  empty-doc write below).
- If `find-todo-doc` reports `status: found` → use the reported
  `documentId`.

## Write (replace contents)

The MCP exposes no "clear document" primitive. Use this two-step
approach to preserve the `documentId`:

1. Call
   `mcp__plugin_google-workspace_google-workspace__docs_getText` to
   read the existing content.

1. Decide which write path applies:

   - **Empty doc** (newly created, or `getText` returns empty/whitespace
     only): call
     `mcp__plugin_google-workspace_google-workspace__docs_writeText`
     with `position: "beginning"` and the bullet block as `text`.
     `position: "end"` fails on empty docs with `"No insertion location
     set."` — always use `"beginning"` here.
   - **Non-empty doc**: call
     `mcp__plugin_google-workspace_google-workspace__docs_replaceText`
     with `findText` set to the entire current text returned by
     `getText`, and `replaceText` set to the bullet block. This swaps
     the contents in place without touching the `documentId`.

Do not add a date header, attribution, or other metadata — the user
asked for nothing beyond the TODO bullets themselves.

## Report

After a successful write, tell the user:

- Doc title and whether it was created or replaced (i.e. existing
  content overwritten).
- Number of sections and TODOs written.

## Failure modes

- `docs_writeText` or `docs_replaceText` returns an error → surface it
  verbatim. Do not retry silently.
- `getText` returns content that contains characters
  `docs_replaceText` cannot match against (rare; usually only an issue
  with embedded images or tables) → tell the user the doc has
  non-text content the skill can't safely replace, and stop.
- User rejects the confirmation preview → abort with no further calls.
