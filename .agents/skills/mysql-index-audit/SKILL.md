---
name: mysql-index-audit
description: >-
  Statically audit a codebase's MySQL indexes against the queries that use
  them. Use when checking for leftmost-prefix violations, partially used
  composite indexes, index killers such as leading wildcards or
  function-wrapped columns, or redundant and missing indexes.
disable-model-invocation: true
argument-hint: '[path | --diff | --uncommitted]'
metadata:
  model-tier: moderate
---

This audit reads code only; it never connects to a database. Static matches
are signals, not proof: every finding must say **verify with `EXPLAIN`**, and
the report must end with the commands to run against the database.

**Scope.** Audit the given path or glob, or the whole repository when no
argument is given. `--diff` means files changed on the branch:
`git diff --name-only "$(git merge-base HEAD main)"...HEAD`, or use `master`
when that is the default branch. `--uncommitted` means
`git diff --name-only HEAD` plus untracked files from `git status --porcelain`.

**Audit sequence.** Before inventorying, read
[INVENTORY-GUIDE.md](references/INVENTORY-GUIDE.md). Before classifying, read
[CLASSIFICATIONS.md](references/CLASSIFICATIONS.md). If interpreting gathered
`EXPLAIN` output, read [EXPLAIN-REFERENCE.md](references/EXPLAIN-REFERENCE.md).

1. **Inventory indexes and queries.** Build one record for each definition
   and query site. Run the two mechanical inventories concurrently as
   independent subagents when supported, on the cheapest adequate tier; use
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md) for their
   completion and retry protocol. Otherwise inventory them in turn.
2. **Classify each query** against indexes on its table. Give every query a
   classification or mark it clean. Dynamic or materialized cases that can't
   be resolved statically belong under **Needs manual EXPLAIN**, not guesses.
3. **Report findings by severity.** Each finding includes the ordered index
   columns and source line, query and source line, classification, why it
   matters, and a concrete fix. Add any cases needing manual EXPLAIN and end
   with the follow-up commands in the report shape below.

> [!IMPORTANT]
> Before recommending a query rewrite, check that it preserves filtering,
> row sets, ordering, limits, and deduplication. Flag equivalence that is not
> proven. Behaviour changes need approval; don't label them as optimization.

## Report

Group findings under these headings. Include counts and source locations. For
any finding, use the format shown under High.

````markdown
## MySQL Index Audit

- **Scope:** <path | branch-diff | uncommitted>
- **Indexes found:** <n>
- **Query sites found:** <n>

### High: index unused or partially used

- **UNUSED** `users.idx_name_country_state (last_name, country, state)`
  (`db/schema.sql:42`)
  - Query `WHERE country = 'UK'` (`internal/users/repo.go:88`) skips the
    leftmost column `last_name`, so the table is scanned.
  - **Fix:** add an index leading with `country`.

### Medium: killers, range ordering, missing indexes

### Low: redundant indexes, covering opportunities

### Needs manual EXPLAIN

- `internal/search/builder.go:120`: WHERE clause built conditionally.

### Verify with EXPLAIN

```sql
EXPLAIN SELECT ...;          -- key vs possible_keys, type, Extra
EXPLAIN ANALYZE SELECT ...;  -- real rows and timing (MySQL 8.0.18+)

-- Find the slow queries to fix first
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
SET GLOBAL long_query_time = 0.5;
SET GLOBAL slow_query_log = 'ON';
```
````

**Sources:** [source notes](https://gist.github.com/Integralist/51ae85eb6f522a6e8399cacefa385258),
[EXPLAIN output](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html),
[Index Merge](https://dev.mysql.com/doc/refman/8.0/en/index-merge-optimization.html),
[generated columns](https://dev.mysql.com/doc/refman/8.0/en/create-table-generated-columns.html),
and [Use The Index, Luke](https://use-the-index-luke.com/).
