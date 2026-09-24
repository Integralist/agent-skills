---
name: conventions-markdown
description: >-
  MANDATORY for any work on Markdown files (*.md). Load this before
  editing or creating any *.md file. Markdown formatting, repository-link,
  and linting conventions.
---

We are peers writing Markdown. Prioritize readability, consistency, and
inclusive language.

## Repository links

Base links on the repository that will contain the document, not the agent's
working directory.

- Use repository-relative paths for files in that repository.
- Link to files, directories, or roots in another GitHub repository with an
  absolute permalink pinned to the exact full commit SHA inspected:
  `https://github.com/<owner>/<repo>/blob/<sha>/<path>#L42` for files and
  `https://github.com/<owner>/<repo>/tree/<sha>/<path>` for directories
  (omit `/<path>` for the repository root).
- Get the SHA with `git -C <checkout> rev-parse HEAD`; form the URL from the
  canonical repository remote as `https://github.com/<owner>/<repo>`. Treat
  `path:line` guidance in other skills as applying only to the document's own
  repository.
- Never publish a sibling-checkout path (`../Northstar/...`) or use a branch,
  tag, or abbreviated SHA. If the source file is modified or untracked, or its
  remote/SHA cannot be verified, say it cannot be pinned or ask for a stable
  revision; do not present HEAD as a permalink to uncommitted content.

## Formatting

- Use `mdformat --number` to automatically format Markdown files while
  preserving consecutive numbering on ordered lists.
- Wrap text at 80 columns manually, do not use `mdformat --wrap 80` as it breaks
  GitHub flavoured quote blocks (e.g. `> [!NOTE]`).
- **AI-facing files exception:** NEVER run `mdformat` on Skill files (`SKILL.md`,
  `**/skills/**`), prompt files (e.g. `**/prompts/**`), agent instructions
  (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`), or any Markdown consumed by an AI.
  Automated formatters collapse 4-backtick Markdown blocks (which protect
  nested 3-backtick blocks) into 3 backticks, alter prompt formatting, and
  strip intentional layout. In AI-facing files, format manually and maintain
  explicit sequential numbering (`1., 2., 3.`).

To install and configure the formatter with the necessary plugins (GitHub
Flavored Markdown and Frontmatter support):

```bash
pipx install mdformat
pipx inject mdformat mdformat-gfm
pipx inject mdformat mdformat-frontmatter
```

## Metadata / label lines

Consecutive lines that aren't separated by a blank line collapse onto a single
line when rendered (GitHub treats them as one paragraph). So a block of
`**Label:** value` lines renders as one run-on line.

Use a bullet list instead:

````md
- **Date:** 2026-06-16
- **Reporter:** Jane Doe
- **Config under test:** `foo`
````

Not this (renders on one line):

````md
**Date:** 2026-06-16
**Reporter:** Jane Doe
**Config under test:** `foo`
````

A bullet list is preferred over forcing breaks with a trailing `\` or two
trailing spaces — it's clearer and survives reformatting.

## Code Blocks

- Always apply a language identifier to code blocks.
- If there is no obvious language, use `txt` as the language (`txt` or `text` is
  generally more widely recognized and supported by syntax highlighters like
  GitHub Linguist, highlight.js, and Prism compared to `plain`).
- When producing a code block for markdown (`markdown` or `md`), use 4
  backticks instead of 3 so any inner code blocks do not break rendering (see
  [`../shared/MARKDOWN-CODE-BLOCKS.md`](../shared/MARKDOWN-CODE-BLOCKS.md)).

````md
```txt
This is a plain text block.
```
````

## Callouts

Use GitHub-flavored alert blockquotes for callouts. Do not use plain prose
prefixes like `Note:`, `Warning:`, or `Tip:`.

Supported types: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`.

````md
> [!NOTE]
> Useful information that users should know, even when skimming.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.
````

## Linting

Use the following linters to ensure quality, style consistency, and inclusivity:

- **[markdownlint](https://github.com/DavidAnson/markdownlint)**: For general
  Markdown style checking and consistency.
- **[alex](https://alexjs.com/)**: For catching insensitive, inconsiderate, or
  offensive writing.
- **[woke](https://docs.getwoke.tech/)**: For detecting and replacing
  non-inclusive language.
