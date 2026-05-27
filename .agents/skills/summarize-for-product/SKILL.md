---
name: summarize-for-product
description: Translate an engineering plan doc or branch diff into a non-engineer-friendly summary for a PR description, Slack update, or email. Output is copy-paste only — nothing is written to the repo.
---

# Summarize for Product

Translate engineering work into a summary aimed at product/management.
Output is communication — paste-ready text in the assistant's response.
Never write to `docs/`.

## Process

Prompt the user upfront for three things — no silent auto-detection.

### 1. Source of truth

Scan `docs/plans/*.md` and surface candidates so the user can confirm.
Prompt with whichever of these apply:

- **Plan doc (matched)** — `docs/plans/<branch-slug>.md`, if present.
- **Plan doc (latest)** — most recently modified `docs/plans/*.md`.
- **Plan doc (pick)** — user names a different path.
- **Local diff** — `git diff origin/<main>...HEAD` (everything on this
  branch vs. **remote** main).
- **Local commits** — `git log origin/<main>..HEAD` commit messages +
  diffs (commits not yet pushed to **remote** main).

Always base diff/log queries on `origin/<main>` (or `origin/master`),
not local `main`. The user often commits to local `main` before
pushing, so a local-`main` base would silently exclude those commits.

If no plan docs exist, omit the plan options and ask between diff vs.
commits.

### 2. Target audience/shape

Prompt the user to choose:

- `pr` — PR description aimed at non-engineers (problem, solution,
  impact, verification).
- `slack` — single short paragraph + 2–4 bullets.
- `email` — multi-paragraph update with subject line.

### 3. Output rendering

Prompt the user to choose how the result is rendered. Suggest a
default based on audience but let the user override.

- `markdown` — GitHub-flavored Markdown. Default for `pr`. Best for PR
  descriptions and GitHub comments.
- `plain` — plain text, no Markdown syntax. Default for `email`. Also
  fine for Slack (Slack's mrkdwn differs from GFM and renders
  `**bold**` literally).
- `slack-mrkdwn` — Slack-flavored markup (`*bold*`, `_italic_`,
  `<url|text>`). Default for `slack` when the user wants formatting.

## Generating the summary

1. Load the chosen source. If the source is a plan doc, also run
   `git diff origin/<main>...HEAD --stat` and flag any drift between
   what the plan promised and what shipped, inline above the summary.
1. Apply these rules:
   - Lead with the user-visible problem and outcome — not file or
     module names.
   - No file paths, function names, or framework jargon unless
     unavoidable. When unavoidable, gloss them.
   - Translate technical decisions into business consequences (e.g.
     "switched to event sourcing" → "we can now reconstruct any past
     state, so support can answer 'what did the customer see last
     Tuesday?'").
   - Cite the plan doc path and PR/branch URL at the bottom for
     engineers who want depth.
1. Render the summary in the chosen format and emit it as the
   assistant's response, wrapped in a fenced code block so the user
   can copy it cleanly.

## Format templates

**`pr` format:**

```txt
## What this changes
<1–2 sentences, user-visible>

## Why
<1–2 sentences, the problem this addresses>

## Impact
- <bullet, who benefits and how>
- <bullet>

## How to verify
- <non-engineer-runnable check, or "engineering-only: see plan doc">

---
Plan: docs/plans/<slug>.md
```

**`slack` format:**

```txt
<one-paragraph TL;DR>

• <bullet>
• <bullet>
• <bullet>

(Details: <plan-doc-path>)
```

**`email` format:** subject line + greeting + 2–3 paragraph body +
sign-off placeholder.

## Output rules

- Output is paste-ready text in the assistant's response, wrapped in
  a fenced code block.
- Never write to `docs/`. This is communication, not an artifact.
- If the user explicitly asks to save it, write to
  `$TMPDIR/summary-<branch>-<format>.md` (mirroring the `handoff`
  skill — OS temp dir, not the repo).
