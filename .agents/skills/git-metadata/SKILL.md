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

# Git Metadata

Run these commands in the working directory and return their output; the
calling skill decides what to do with it. Flag every file that appears in
both churn hotspots and bug clusters as the highest-risk code.

**Churn hotspots:** the most-changed files in the last year.

```bash
git log --format=format: --name-only --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
```

**Bus factor:** contributors by commit count, all time and recent.

```bash
git shortlog -sn --no-merges
git shortlog -sn --no-merges --since="6 months ago"
```

**Bug clusters:** the files most often touched by bug-fix commits.

```bash
git log -i -E --grep="fix|bug|broken" \
  --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

**Commit velocity:** commits per month.

```bash
git log --format='%ad' --date=format:'%Y-%m' \
  | sort | uniq -c
```

**Crisis patterns:** reverts, hotfixes, and rollbacks in the last year.

```bash
git log --oneline --since="1 year ago" \
  | grep -iE 'revert|hotfix|emergency|rollback'
```
