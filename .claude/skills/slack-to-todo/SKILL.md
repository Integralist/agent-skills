---
name: slack-to-todo
description: Parse a pasted Slack message of section-grouped tasks and replace the contents of a personal "TODO" Google Doc with them as plain-text bullets, skipping items marked :checkm: (done) and creating the doc if it doesn't exist.
argument-hint: The Slack message text to extract TODOs from
---

# slack-to-todo

Capture task lines from a pasted Slack message — where every non-header
line is a task except those marked done with `:checkm:` — and
**replace** the full contents of the user's personal `TODO` Google Doc
with them as section-grouped bullets.

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

The pasted message is structured as section groups. Within each group,
the **first line is the section header** and every following line is a
task — except that:

- A line beginning with `:checkm:` is a completed task and is **skipped
  entirely** (it represents work already done).
- A line beginning with a **lowercase letter** is treated as a
  continuation of the prior line (Slack's plain-text paste flattens
  nesting, so we can't reliably attach these as children). It is
  **skipped**, regardless of whether the prior line was kept or skipped.

Discard banners and unrelated content above the task list (e.g. a
`MEETINGS` block, meeting times, `TODAY` headers). The skill operates
only on the section-grouped task region of the paste.

Algorithm:

1. Identify the task region. If the paste contains a banner like
   `TODO` on its own line, treat everything after it as the task
   region; otherwise treat the entire paste as the task region.
1. Split the task region into **groups** separated by one or more blank
   lines. (Slack copy-paste sometimes produces single or double blank
   lines between groups; both are treated the same.)
1. For each group:
   - The first non-blank line is the **section header**. Keep trailing
     punctuation as written (`Miscellaneous.` stays `Miscellaneous.`).
   - Each subsequent line is a candidate task. Skip it if it begins
     with `:checkm:` or with a lowercase letter. Otherwise keep it
     verbatim as a task under that section.
1. Drop sections that end up with zero kept tasks.

Tasks may contain other emojis (`:ahh:`, `:white_check_mark:`, etc.) —
keep them verbatim.

If no kept tasks remain after parsing, tell the user nothing was
parseable and stop — do not call any Drive or Docs tool.

### Known fidelity loss

Plain-text paste from Slack does not preserve indentation, so tasks
that were originally nested under another task in Slack will appear as
siblings, not children, in the doc. This is accepted: a flat list is
preferable to a wrong tree. If true nesting matters, the user must mark
it manually before pasting.

## Confirmation step (mandatory)

Before any Drive/Docs call, print:

1. The exact bullet block that will be written.
1. A reminder that this **replaces** the existing doc contents.

Then ask the user to confirm. Header detection is heuristic and the
write is destructive — the user must be able to abort.

Format:

```txt
- Category
  - Task.
- Category
  - Task.
- Category
  - Task.
```

Two-space indent. Tasks always sit one level under their section
header — no deeper nesting (see "Known fidelity loss" above).

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
     `position: "end"` fails on empty docs with `"No insertion location set."` — always use `"beginning"` here.
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
