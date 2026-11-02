---
name: summarize-for-product
description: >-
  Translate an engineering plan or branch diff into a summary for a
  non-engineer audience, as copy-paste text for a PR description, Slack
  update, or email. Use when the user wants a plan or diff explained to
  product, management, or other non-engineers.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(ls:*)
metadata:
  model-tier: trivial
---

Turn engineering work into copy-ready text for product or management. Return
it in a fenced code block; write no files unless asked to save it, then use
`$TMPDIR/summary-<branch>-<format>.md`.

## Agree on the source and shape first

Ask the user all three questions in one message; do not silently detect or
choose these settings:

1. **Source.** Offer applicable choices: the branch-matched plan
   (`projects/<branch-slug>/plan.md`); latest `projects/*/plan.md` or legacy
   `docs/plans/*.md`; a user-named path; the branch diff
   (`git diff origin/<main>...HEAD`); or unpushed commits
   (`git log origin/<main>..HEAD` with diffs). Base diffs and logs on
   `origin/main` or `origin/master`, never local `main`, or local commits may
   be missed. If no plans exist, offer only diff or commits.
2. **Shape:** `pr` (problem, solution, impact, verification), `slack` (one
   short paragraph, 2–4 bullets), or `email` (multi-paragraph, subject line).
3. **Rendering:** default to `markdown` for `pr`, `plain` for `email` (also
   safe for Slack, which displays `**bold**` literally), or `slack-mrkdwn`
   (`*bold*`, `_italic_`, `<url|text>`) for formatted Slack.

Read [OUTPUT-TEMPLATES.md](references/OUTPUT-TEMPLATES.md) for the chosen shape
before writing. Continue only after the user chooses all three.

## Support claims with the source

A proposed-plan summary describes intent, not delivered work. For
implementation claims or plan-drift checks, read the full relevant diff and
enough code to support material claims; `--stat` alone cannot establish
behaviour. Distinguish planned, implemented, tested, and deployed work. Mark
unsupported claims unverified.

Use [voice-product](../voice-product/SKILL.md) and
[CONCISE-PROSE.md](../shared/CONCISE-PROSE.md). Cite the plan path and PR or
branch URL at the bottom for engineers.

## Deliver

Return the rendered text in the reply.
