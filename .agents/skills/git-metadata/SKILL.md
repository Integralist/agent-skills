---
name: git-metadata
description: >-
  Git-history diagnostic snapshot — churn hotspots, bus factor,
  bug clusters, commit velocity, and crisis patterns.
disable-model-invocation: true
---

# Git Metadata

Run these commands in the working directory and capture output.
The calling skill determines how to use the results.

## Churn hotspots — most-changed files in the last year

```bash
git log --format=format: --name-only --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
```

## Bus factor — contributors ranked by commit count

```bash
git shortlog -sn --no-merges
git shortlog -sn --no-merges --since="6 months ago"
```

## Bug clusters — files most often touched in bug-fix commits

```bash
git log -i -E --grep="fix|bug|broken" \
  --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

## Commit velocity — commits per month

```bash
git log --format='%ad' --date=format:'%Y-%m' \
  | sort | uniq -c
```

## Crisis patterns — reverts, hotfixes, and rollbacks

```bash
git log --oneline --since="1 year ago" \
  | grep -iE 'revert|hotfix|emergency|rollback'
```

## Cross-reference

Files appearing in **both** churn hotspots and bug clusters are
highest-risk code. Flag these explicitly.
