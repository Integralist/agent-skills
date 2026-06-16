---
paths:
  - '**/*.md'
---

We are peers writing Markdown. Prioritize readability, consistency, and
inclusive language.

## Formatting

- Use the formatter tool `mdformat` to automatically format Markdown files.
- Wrap text at 80 columns manually, do not use `mdformat --wrap 80` as it breaks
  GitHub flavoured quote blocks (e.g. `> [!NOTE]`).

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

```md
- **Date:** 2026-06-16
- **Reporter:** Jane Doe
- **Config under test:** `foo`
```

Not this (renders on one line):

```md
**Date:** 2026-06-16
**Reporter:** Jane Doe
**Config under test:** `foo`
```

A bullet list is preferred over forcing breaks with a trailing `\` or two
trailing spaces — it's clearer and survives reformatting.

## Code Blocks

- Always apply a language identifier to code blocks.
- If there is no obvious language, use `txt` as the language (`txt` or `text` is
  generally more widely recognized and supported by syntax highlighters like
  GitHub Linguist, highlight.js, and Prism compared to `plain`).

````md
```txt
This is a plain text block.
```
````

## Callouts

Use GitHub-flavored alert blockquotes for callouts. Do not use plain prose
prefixes like `Note:`, `Warning:`, or `Tip:`.

Supported types: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`.

```md
> [!NOTE]
> Useful information that users should know, even when skimming.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.
```

## Linting

Use the following linters to ensure quality, style consistency, and inclusivity:

- **[markdownlint](https://github.com/DavidAnson/markdownlint)**: For general
  Markdown style checking and consistency.
- **[alex](https://alexjs.com/)**: For catching insensitive, inconsiderate, or
  offensive writing.
- **[woke](https://docs.getwoke.tech/)**: For detecting and replacing
  non-inclusive language.
