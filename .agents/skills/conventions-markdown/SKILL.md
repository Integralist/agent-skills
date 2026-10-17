---
name: conventions-markdown
description: >-
  MANDATORY for any work on Markdown files (*.md). Load this before
  editing or creating any *.md file. Markdown formatting, repository-link,
  and linting conventions.
metadata:
  model-tier: moderate
---

# Markdown Conventions

Write Markdown that reads well, renders correctly on GitHub, and uses
inclusive language.

**Formatting.** Wrap prose at 80 columns by hand. Format with
`mdformat --number`, which keeps ordered lists numbered 1, 2, 3, never with
`--wrap`, which breaks GitHub alert blocks. Never run `mdformat` on files an
agent reads: skills (`**/skills/**`), prompts (`**/prompts/**`), and
`AGENTS.md`, `CLAUDE.md`, or `GEMINI.md`. It collapses the 4-backtick fences
that protect nested code blocks and strips deliberate layout, so format those
by hand and keep their lists numbered 1, 2, 3. Install it with
`pipx install mdformat` and
`pipx inject mdformat mdformat-gfm mdformat-frontmatter`.

**Label lines.** GitHub joins consecutive lines into one paragraph, so a stack
of `**Label:** value` lines renders as one run-on line. Make them a bullet
list instead of forcing breaks with a trailing `\` or spaces:

```md
- **Date:** 2026-06-16
- **Reporter:** Jane Doe
```

**Code blocks.** Give every code block a language, using `txt` when there's no
obvious one. Fence a Markdown code block with 4 backticks, so 3-backtick
blocks inside it don't end it early:

`````md
````md
Run this:

```bash
make test
```
````
`````

**Callouts.** Use GitHub alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`,
`> [!WARNING]`, `> [!CAUTION]`), not prose prefixes like `Note:`.

**Links.** Base links on the repository that will hold the document, not your
working directory. Link files in the same repository with relative paths.
Link another GitHub repository with a permalink pinned to the full commit SHA
you inspected: `https://github.com/<owner>/<repo>/blob/<sha>/<path>#L42` for a
file, or `/tree/<sha>/<path>` for a directory (omit the path for the root).
Get the SHA with `git -C <checkout> rev-parse HEAD` and the URL from the
canonical remote. Never publish a sibling-checkout path (`../other-repo/…`), a
branch, a tag, or a short SHA. If the file is modified or untracked, or you
can't verify its remote and SHA, say it can't be pinned or ask for a stable
revision rather than presenting HEAD as a permalink. `path:line` guidance in
other skills applies only within the document's own repository.

**Linting.** Check style with
[markdownlint](https://github.com/DavidAnson/markdownlint) and inclusive
language with [alex](https://alexjs.com/) and
[woke](https://docs.getwoke.tech/).
