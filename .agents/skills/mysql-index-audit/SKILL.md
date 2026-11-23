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

Static code audit only—never connect to a database. Every static finding is a
signal, not proof: mark each **verify with `EXPLAIN`**, and end with the SQL
commands to verify against the database.

**Scope:** Audit the given path/glob, or the whole repo if omitted. `--diff`
audits branch-changed files against `main`/`master`; `--uncommitted` audits
`git diff --name-only HEAD` plus untracked files.

**Before auditing:** Read [AUDIT-REFERENCE.md](references/AUDIT-REFERENCE.md)
for inventory rules (including ORM column-order gotchas) and MySQL-specific
classification rules.

1. **Inventory indexes and queries.** Record each index (`table`, `name`,
   `ordered_columns[]`, `unique?`, `file:line`) and query site (`table`,
   predicates + operators, `ORDER BY`, `SELECT`, `file:line`). On large repos,
   run index and query inventories concurrently as read-only subagents per
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md). Never
   guess on dynamic WHERE clauses or materialized CTEs—list them under
   **Needs manual EXPLAIN**.
2. **Classify and rank by real impact.** Match every query against its
   table's indexes and rank findings **High / Medium / Low** by expected
   scan/write impact (a missing index or index killer on a hot query can be
   High, while a low-traffic partial composite may be Medium).
3. **Report.** For each finding give index columns + `file:line`, query +
   `file:line`, classification, impact, and concrete fix (noting
   **verify with `EXPLAIN`**). Include **Needs manual EXPLAIN** and a
   **Verify with EXPLAIN** SQL block (`EXPLAIN`, `EXPLAIN ANALYZE`, slow
   query log check).

> [!IMPORTANT]
> Before suggesting any query rewrite, verify it preserves filtering, row
> sets, ordering, limits, and deduplication. Flag unproven equivalence; never
> disguise a behaviour change as an optimization.
