# Summary Output Templates (Share-Outs)

Read this reference only when `--shape pr|slack|email` or a copy-ready
non-engineer share-out (PR, Slack, or email update) is requested.

## Gathering choices and source

If the source, `--shape` (`pr`, `slack`, `email`), or rendering (`markdown`,
`plain`, `slack-mrkdwn`) is missing, ask all missing choices in one message
before writing.

Choose the source in this order:
1. Named path or branch diff.
2. Branch-matched `projects/<branch-slug>/plan.md` (or latest
   `projects/*/plan.md` / legacy `docs/plans/*.md`).
3. Otherwise compare the branch against `origin/main` or `origin/master` per
   [SOURCES.md](SOURCES.md).

## Framing and output

- Translate engineering work into user-visible changes, impact, risks, and
  verification steps; keep caveats beside claims and distinguish planned vs.
  shipped work.
- Return copy-ready text inside a fenced code block using the agreed
  rendering (`markdown`, `plain`, or `slack-mrkdwn`), citing the plan path and
  PR or branch URL at the bottom for engineers.

## PR

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

## Slack

```txt
<one-paragraph TL;DR>

• <bullet>
• <bullet>
• <bullet>

(Details: <plan-doc-path>)
```

## Email

Include a subject line, greeting, 2–3 paragraph body, and sign-off
placeholder.
