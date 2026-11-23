# MySQL Index Audit Reference

Read before inventorying or classifying.

## Inventory rules & gotchas

- **Exact column order is critical:** Copy composite column order verbatim
  from DDL (`CREATE INDEX`, `ADD INDEX/KEY`, `PRIMARY KEY`, inline `CREATE
  TABLE` keys) and ORM definitions (`Rails`, `Django`, `SQLAlchemy/Alembic`,
  `Sequelize/TypeORM`, `Ecto`).
- **GORM gotcha:** Composite column order comes from `priority:N` in
  `gorm:"index:idx_name,priority:N"`, **not** struct field order.
- **Static vs. manual EXPLAIN:**
  - Dynamic `WHERE` clauses built at runtime → **Needs manual EXPLAIN**.
  - Static catch-all `(col = ? OR ? IS NULL)` / `COALESCE(:p, col)` →
    classify as **KILLER** (forces full scan), not dynamic.
  - Non-recursive CTEs/derived tables without `GROUP BY`, `DISTINCT`,
    `HAVING`, `LIMIT`, `UNION`, aggregates, or window functions merge into the
    outer query (inventory normally); anything with those constructs—or any
    recursive CTE—materialises into `<derivedN>` and goes under **Needs manual
    EXPLAIN** if filtered or joined downstream.

## Classifications & MySQL-specific gotchas

Use these tags: `UNUSED` (leftmost-prefix miss), `PARTIAL` (skipped middle
column), `RANGE-ORDER` (range before equality), `KILLER` (leading wildcard,
function wrap, type mismatch, catch-all OR/COALESCE), `MISSING` (unindexed
frequent `WHERE`/`JOIN`/FK probe), `REDUNDANT` (leftmost prefix of another
index—note write speedup on drop), `INDEX-MERGE`, `COVERING`,
`GENERATED-COLUMN`, `SORT-ORDER`, `PAGINATION` (deep `OFFSET` → keyset).

Watch for MySQL/InnoDB specifics:
- **Implicit PK suffix:** InnoDB secondary indexes automatically include the
  PK (`(a)` is physically `(a, <pk>)`). Never recommend adding PK columns to
  cover a query; do flag wide/natural PKs as write/size multipliers across all
  secondary indexes.
- **No `INCLUDE` or `NULLS FIRST/LAST`:** Covering requires adding selected
  columns to the key; `NULL`s sort first `ASC` and last `DESC`.
- **Mixed-direction `ORDER BY`:** `DESC` index columns require MySQL 8.0+
  (MariaDB 10.8+); earlier versions silently ignore `DESC`—confirm version.
- **Generated columns:** `VIRTUAL` avoids storage/write cost for cheap
  expressions; `STORED` is safer for expensive expressions, sorting, or
  aggregating (`JSON_EXTRACT`, `LENGTH`).
- **`INDEX-MERGE` is not an automatic defect:** Confirm with `EXPLAIN
  ANALYZE` before rewriting. For `OR` → `UNION` rewrites, apply global
  `ORDER BY`/`LIMIT` to the combined query and preserve row-identity
  deduplication (`UNION` drops duplicate tuples; `UNION ALL` keeps them).
- **Reading user-supplied `EXPLAIN`:** `type: ALL` on a small `<derivedN>` or
  `<unionM,N>` temp table is normal; `key_len` measures only access-predicate
  bytes (shorter than full composite confirms `PARTIAL` or `RANGE-ORDER`).
