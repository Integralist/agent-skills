---
name: find-todo-doc
description: Locate the user's personal "TODO" Google Doc and report its documentId and title. Read-only helper for other skills (slack-to-todo, today, etc.).
---

# find-todo-doc

Read-only lookup for the user's personal `TODO` Google Doc. Other
skills follow this one to obtain a `documentId` they can act on.

This skill **never** creates, modifies, or deletes anything. If the
caller needs create-if-missing semantics, they handle that themselves
after this skill reports zero matches.

## Lookup

Call
`mcp__plugin_google-workspace_google-workspace__drive_search` with:

```txt
name = 'TODO' and mimeType = 'application/vnd.google-apps.document' and trashed = false and 'me' in owners
```

The `'me' in owners` filter matters — there may be other `TODO` docs
shared into your Drive owned by other people. Only return docs you own.

## Resolve matches

- **Zero matches** → report `not found`. Do not create the doc. Stop.
- **One match** → report it (see output format below).
- **Multiple matches** → use `AskUserQuestion` to disambiguate, listing
  each candidate by title and last-modified time. Once the user picks,
  report the chosen one.

## Output format

Print exactly this block (callers parse it):

```txt
TODO-DOC-LOOKUP:
  status: found | not-found
  documentId: <id or empty>
  title: <title or empty>
  url: <https://docs.google.com/document/d/<id>/edit or empty>
```

For `not-found`, `documentId`, `title`, and `url` are empty strings.

## Failure modes

- `drive_search` errors → surface the error verbatim and stop.
- User cancels the disambiguation prompt → report `not-found` and stop.
