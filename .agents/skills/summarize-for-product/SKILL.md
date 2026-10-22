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

# Summarize for Product

Turn engineering work into paste-ready text for product and management, given
in the reply inside a fenced code block for clean copying. It's communication,
not an artifact: write nothing to the repo, and if the user asks to save it,
write `$TMPDIR/summary-<branch>-<format>.md`.

1. **Ask the user three things up front,** rather than detecting silently:
   - **Source:** offer whichever apply: the plan matching the branch
     (`projects/<branch-slug>/plan.md`), the latest `projects/*/plan.md` or
     legacy `docs/plans/*.md`, a path they name, the branch diff
     (`git diff origin/<main>...HEAD`), or unpushed commits
     (`git log origin/<main>..HEAD` with their diffs). Base every diff and log
     on `origin/main` or `origin/master`, never local `main`, since the user
     often commits to local main before pushing and those commits would
     vanish. With no plans, offer only diff or commits.
   - **Shape:** `pr` (problem, solution, impact, verification), `slack` (one
     short paragraph and 2–4 bullets), or `email` (a multi-paragraph update
     with a subject line).
   - **Rendering,** defaulting by shape: `markdown` for `pr`, `plain` for
     `email` (also safe for Slack, which shows `**bold**` literally), or
     `slack-mrkdwn` (`*bold*`, `_italic_`, `<url|text>`) for `slack` when the
     user wants formatting.

   Done when all three are chosen.
2. **Load the source.** A proposed-plan summary describes intent, not
   delivered work. For implementation claims or plan-drift checks, read the
   relevant full diff and enough surrounding code to support material claims;
   `--stat` alone can't establish behaviour. Distinguish planned, implemented,
   tested, and deployed work. Done when claims are supported or explicitly
   unverified.
3. **Write it** in the [voice-product](../voice-product/SKILL.md) voice,
   omitting needless words per [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md),
   in the template for the chosen shape, and cite the plan path and PR or
   branch URL at the bottom for engineers who want depth. Done when the
   rendered text is in the reply.

**`pr`:**

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
Plan: projects/<slug>/plan.md
```

**`slack`:**

```txt
<one-paragraph TL;DR>

• <bullet>
• <bullet>
• <bullet>

(Details: <plan-doc-path>)
```

**`email`:** a subject line, greeting, 2–3 paragraph body, and a sign-off
placeholder.
