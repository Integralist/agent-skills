---
name: conventions-markdown
description: >-
  MANDATORY for any work on Markdown files (*.md). Load this before
  editing or creating any *.md file. Markdown formatting, repository-link,
  and linting conventions.
metadata:
  model-tier: trivial
---

Write Markdown that reads well, renders correctly on GitHub, and uses
inclusive language.

## Formatting

Wrap prose at 80 columns by hand in repository files. Never hard-wrap text
published to GitHub: issue and PR descriptions, comments, and Issue Artifacts.
GitHub renders each newline there as a line break, so write each paragraph and
list item on one line, even when a local `*.md` file is the draft. Use `mdformat
--number` where formatting is appropriate; ordered lists stay numbered 1, 2, 3.
Do not use `--wrap`, which breaks GitHub alert blocks. Install with:

```bash
pipx install mdformat
pipx inject mdformat mdformat-gfm mdformat-frontmatter
```

Never run `mdformat` on agent-facing Markdown: skills (`**/skills/**`), prompts
(`**/prompts/**`), `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md`. It can collapse
four-backtick fences around nested code blocks and remove deliberate layout.
Format those files by hand.

## Labels, code, and callouts

GitHub joins consecutive lines into one paragraph. Use bullets for label/value
pairs rather than trailing spaces or backslashes:

```md
- **Date:** 2026-06-16
- **Reporter:** Jane Doe
```

Give every code block a language; use `txt` when no language fits. Use four
backticks to fence a Markdown example containing three-backtick blocks:

`````md
````md
Run this:

```bash
make test
```
````
`````

Use GitHub alerts (`> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`,
`> [!WARNING]`, `> [!CAUTION]`) instead of prose prefixes such as `Note:`.

## Links

Base links on the repository that will hold the document, not the working
directory. Link files in the same repository with relative paths. For another
GitHub repository, use a permalink pinned to the full commit SHA inspected:

- File: `https://github.com/<owner>/<repo>/blob/<sha>/<path>#L42`
- Directory: `https://github.com/<owner>/<repo>/tree/<sha>/<path>`
- Repository root: `https://github.com/<owner>/<repo>/tree/<sha>`

Get the full SHA with `git -C <checkout> rev-parse <commit>` and the URL from
the canonical remote. Use a short SHA in prose or metadata, such as a Baseline
row, only when it uniquely identifies the commit in the named repository. Keep
a pinned link with the full SHA in the document; never put an abbreviated SHA
in a URL. Generate a unique abbreviation with
`git -C <checkout> rev-parse --short=12 <commit>`; Git may return more
characters when needed to disambiguate. Never publish sibling-checkout paths,
branches, or tags. If the source is modified or untracked, or its remote and SHA
cannot be verified, say it cannot be pinned or ask for a stable revision
instead of presenting HEAD as a permalink. `path:line` references in other
skills apply only within the document's own repository.

## Linting

Check style with [markdownlint](https://github.com/DavidAnson/markdownlint),
inclusive language with [alex](https://alexjs.com/) and
[woke](https://docs.getwoke.tech/).
