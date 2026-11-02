---
name: git-metadata
description: >-
  Collect a diagnostic snapshot of a repo's git history: churn hotspots, bus
  factor, bug clusters, commit velocity, and crisis patterns. Use when another
  skill needs history signals to judge risk or where to look first.
disable-model-invocation: true
metadata:
  model-tier: trivial
---

Run these commands in the working directory and return their output to the
calling skill, which decides what to do with it. Flag files in both churn
hotspots and bug clusters as highest risk.

## Churn hotspots

Most-changed files in the last year:

```bash
git log --format=format: --name-only --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
```

## Bus factor

Contributor commit counts, across all history and the last six months:

```bash
git shortlog -sn --no-merges
git shortlog -sn --no-merges --since="6 months ago"
```

## Bug clusters

Files most often touched by bug-fix commits:

```bash
git log -i -E --grep="fix|bug|broken" \
  --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

## Commit velocity

Commits per month:

```bash
git log --format='%ad' --date=format:'%Y-%m' \
  | sort | uniq -c
```

## Crisis patterns

Reverts, hotfixes, and rollbacks in the last year:

```bash
git log --oneline --since="1 year ago" \
  | grep -iE 'revert|hotfix|emergency|rollback'
```
