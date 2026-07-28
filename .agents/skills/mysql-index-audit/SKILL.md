---
name: mysql-index-audit
description: >-
  Audit a codebase for MySQL index correctness. Finds composite
  indexes broken by leftmost-prefix violations, queries that only
  partially use an index (index gaps), and index killers (leading
  wildcards, function-wrapped columns, type mismatches). Static
  analysis of schema + query code; reports EXPLAIN follow-ups.
disable-model-invocation: true
argument-hint: '[path | --diff | --uncommitted]'
---

# MySQL Index Audit

Statically audit a codebase for MySQL index correctness. The audit inventories
every index definition and every query site it can find in the code, correlates
them, and reports indexes that queries fail to use correctly — primarily
**leftmost-prefix violations** (the index can't be used at all) and **index
gaps** (the index is only partially used). It also flags the common "index
killers" and surfaces opportunities (covering indexes, generated columns).

> [!IMPORTANT]
> This audit is **static** — it reads code, it does not connect to a database.
> A static match against schema and query text is a strong signal, but the
> optimizer's actual choice depends on live statistics (cardinality, table
> size, row estimates). Every finding ends with an `EXPLAIN` command the user
> runs to confirm. Treat findings as "verify with EXPLAIN", not "proven".

## Input

The argument follows the skill invocation. Detect the mode:

| Argument                  | Mode                                         |
| ------------------------- | -------------------------------------------- |
| File path or glob pattern | Audit the given path(s)                      |
| No argument               | Audit the whole repository                   |
| `--diff`                  | Scope to files changed on the branch vs main |
| `--uncommitted`           | Scope to uncommitted changes                 |

For `--diff`, derive the changed file list with
`git diff --name-only "$(git merge-base HEAD main)"...HEAD` (fall back to
`master` if `main` does not exist). For `--uncommitted`, use
`git diff --name-only HEAD` plus untracked files from `git status --porcelain`.

## Step 1 — Inventory the indexes

Find every index definition. **Column order is the critical datum** — capture
the ordered column list verbatim from each definition; the whole audit hinges on
it. Build one record per index:

```txt
{ table, index_name, ordered_columns[], unique?, source_file:line }
```

Grep across the common MySQL code shapes. Use `rg` for these patterns:

- **Raw DDL** (migrations, `*.sql`, embedded SQL strings):
  - `CREATE\s+(UNIQUE\s+)?INDEX`
  - `ADD\s+(UNIQUE\s+)?(INDEX|KEY)`
  - `PRIMARY\s+KEY`
  - inline `(UNIQUE\s+)?(INDEX|KEY)\s+` clauses inside a `CREATE TABLE` body
- **ORM / framework declarations** (grep these code shapes regardless of the
  host language):
  - **Go / GORM:** struct tags — `gorm:"index"`, `gorm:"uniqueIndex"`,
    `index:idx_name,priority:N` (priority sets composite column order)
  - **Rails / ActiveRecord:** `add_index`, `t.index`
  - **Django:** `Meta.indexes`, `index_together`, `db_index=True`,
    `unique_together`
  - **Sequelize / TypeORM:** `@Index(`, `indexes: [`
  - **SQLAlchemy / Alembic:** `Index(`, `op.create_index(`
  - **Ecto:** `create index(`, `create unique_index(`

> [!NOTE]
> For composite indexes the **declaration order of the columns is the index
> column order**. In GORM, ordering comes from the `priority` field, not source
> position — read it carefully. A wrong column order recorded here produces
> wrong findings downstream.

## Step 2 — Inventory the queries

Find every query site and extract, per query:

```txt
{ table, predicate_columns[], operators[], order_by_columns[], select_columns[] }
```

Where `operators[]` records, per predicate column, whether it is equality
(`=`, `IN`), a range (`>`, `<`, `>=`, `<=`, `BETWEEN`, `LIKE 'x%'`), or a
killer (function wrap, leading wildcard, type mismatch — see Step 3).

Grep for:

- **Raw SQL:** `SELECT`, `FROM`, `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY`
  fragments in strings and `*.sql` files.
- **Query builders:** `.where(`, `.filter(`, `Where(`, `find_by`, `.eq(`,
  `.in(`, `.order(`, `where:` keyword args, and similar per the ORM in use.

> [!WARNING]
> Dynamically built WHERE clauses (string concatenation, conditional predicate
> assembly, query builders whose columns depend on runtime input) **cannot be
> fully resolved statically**. Do not guess their column set. List them in the
> report under "Needs manual EXPLAIN" with the file:line, so the user can run
> `EXPLAIN` against the actual generated SQL. One shape is the exception: a
> static `OR :p IS NULL` catch-all is fully visible in the source — classify it
> as a KILLER (Step 3), not "needs EXPLAIN".

> [!NOTE]
> A **CTE or derived table** is either *merged* into the outer query or
> *materialized* into an internal temp table. When **merged** (the default —
> `derived_merge` optimizer switch on), predicates against it use the base
> table's indexes, so inventory those queries normally. But a CTE body
> containing `GROUP BY`, `DISTINCT`, `HAVING`, `LIMIT`, `UNION`, or an
> aggregate/window function forces **materialization** (recursive CTEs always
> materialize). A materialized CTE is an unindexed temp table — `EXPLAIN` shows
> `<derivedN>` and base-table indexes no longer serve outer predicates against
> it, though the optimizer may add an auto-generated key (`auto_key0`) for `ref`
> access. Flag a CTE that is filtered or joined after a materialization-forcing
> construct under "Needs manual EXPLAIN".

## Step 3 — Correlate and classify

For each query, match it against the indexes on the same table and classify it.
The classifications below are the core of the audit.

> [!IMPORTANT]
> **InnoDB indexes are clustered: every secondary index implicitly carries the
> primary-key columns.** The table *is* its primary-key index, so a secondary
> index on `(a)` is physically `(a, <pk>)`, and a secondary-index lookup that
> needs other columns must then seek the clustered index by PK. Two
> consequences drive findings below:
>
> - A query selecting only the index's own columns **plus PK columns** is
>   already covered — don't recommend adding the PK to the index (see COVERING).
> - A wide primary key bloats *every* secondary index on the table, slowing
>   writes and inflating storage. Flag wide or natural PKs as a cost multiplier.

### UNUSED — leftmost-prefix violation

The query filters on indexed columns but **not the leftmost column** of the
index. The index cannot be used at all; MySQL falls back to a full table scan
(`type: ALL`).

```sql
-- Index:  (last_name, country, state)
-- BAD: skips the leftmost column entirely -> index unusable
SELECT * FROM users WHERE country = 'UK';
```

Fix: reorder the index so the queried column is leftmost, or add an index that
leads with it.

### PARTIAL — index gap

The query uses the leftmost column(s) but **skips a column in the middle** of
the index. MySQL uses the index up to the gap, then scans for the rest.

```sql
-- Index:  (last_name, country, state)
-- PARTIAL: uses index for `last_name` only; `country` is missing, so it cannot
-- seek on `state`. All 'Smith' rows are scanned to filter for 'California'.
SELECT * FROM users WHERE last_name = 'Smith' AND state = 'California';
```

> [!NOTE]
> The **order columns appear in the `WHERE` clause does not matter** — the
> optimizer reorders predicates to match the index. What matters is that the
> required leftmost columns are all **present**. So
> `WHERE state = 'California' AND country = 'US' AND last_name = 'Smith'` uses
> the full `(last_name, country, state)` index even though it is "out of order".

Fix: include the skipped column in the query, or add a composite index matching
the query's actual column set.

### RANGE-then-equality ordering (equality before range)

When designing a composite index, place **equality** columns (`=`, `IN`)
*before* **range** columns (`>`, `<`, `>=`, `<=`, `BETWEEN`, `LIKE 'x%'`). A
range predicate on an index column stops the index from being used for any
column **to its right** — MySQL evaluates **one** range per index lookup, then
filter-scans the remaining matched rows.

```sql
-- BAD: range column first -> only `created_at` is seekable
CREATE INDEX idx_users_created_country ON users (created_at, country);

-- The `>=` range halts index traversal at `created_at`; every matched row is
-- then scanned to filter `country`.
SELECT * FROM users WHERE country = 'UK' AND created_at >= '2026-01-01';

-- GOOD: equality first, range last -> both columns used
CREATE INDEX idx_users_country_created ON users (country, created_at);

-- Seeks `country = 'UK'`, then range-scans `created_at` within it.
SELECT * FROM users WHERE country = 'UK' AND created_at >= '2026-01-01';
```

> [!NOTE]
> The same applies when the query has multiple range predicates: only one
> range column benefits from the index. Order the index so the most selective
> range comes last and the rest are filtered.

> [!NOTE]
> The vocabulary for this: columns the index can *seek* on are **access
> predicates** — they set the scan's start and stop points; columns it can only
> *check* after the seek are **filter predicates** — rows are read, then
> discarded. A range turns every column to its right into a filter predicate.
> `EXPLAIN` exposes the split: access predicates lengthen `key_len`, filter
> predicates show as `Using where`. The audit's goal is to maximise access
> predicates — equality columns first, then a single range.

### Index killers

Even with a matching index, these force a scan:

| Killer           | Slow                            | Fast / Fix                                   |
| ---------------- | ------------------------------- | -------------------------------------------- |
| Leading wildcard | `LIKE '%smith'`                 | `LIKE 'smith%'`                              |
| Function wrap    | `WHERE YEAR(d) = 2026`          | `WHERE d >= '2026-01-01' AND d < '2027-...'` |
| Function wrap    | `WHERE LOWER(name) = 'pikachu'` | functional index, or generated column        |
| Type mismatch    | `WHERE varchar_id = 123`        | quote it: `WHERE varchar_id = '123'`         |

A type mismatch (comparing a `VARCHAR` column to a numeric literal) forces MySQL
to convert every row before comparing — the index is bypassed.

### KILLER — catch-all / smart-logic predicates

A query that makes each filter optional with `OR :p IS NULL` (or
`col = COALESCE(:p, col)`) forces the optimizer to plan for the worst case —
every filter disabled — so it picks a full table scan and keeps that plan even
when the caller supplies a value. Unlike a genuinely dynamic WHERE clause, this
shape is fully visible in the source, so classify it here rather than deferring
it to "Needs manual EXPLAIN".

```sql
-- KILLER: any predicate may be NULL-disabled -> full scan, always
SELECT * FROM employees
 WHERE (subsidiary_id = ? OR ? IS NULL)
   AND (last_name     = ? OR ? IS NULL);
```

Fix: build the WHERE clause dynamically, emitting only the predicates the caller
supplied (still with bind parameters). Each resulting shape gets its own plan
and uses the matching index.

### REDUNDANT / DUPLICATE indexes

An index whose columns are a **leftmost prefix** of another index is
redundant — the longer index already serves it. Flag it as a drop candidate.

```txt
idx_a (user_id)                <- redundant: prefix of idx_b
idx_b (user_id, created_at)    <- keep
```

> [!NOTE]
> Indexes are a **read-fast / write-slow** trade-off: every `INSERT`, `UPDATE`,
> and `DELETE` must update each index, and each index costs storage. Removing
> redundant indexes speeds up writes — call this out in the report.

### MISSING index

A frequent `WHERE`/`JOIN` predicate with no index whose leftmost column matches.
Recommend a composite index ordered equality-columns-first.

A **join** predicate needs an index just as a `WHERE` does. In a nested-loops
join MySQL probes the joined ("driven") table once per driving row, so the join
columns on the driven side — typically the foreign key — must be indexed, or
each probe is a full scan. Flag an unindexed join/FK column as MISSING.

### INDEX-MERGE — two indexes doing one index's job

The query has independent predicates on two columns, each served by its own
single-column index, so MySQL merges them (`EXPLAIN` shows type `index_merge`
and `Using union`/`Using intersect(...)`). One index scan is faster than two: a
single composite index almost always beats a merge, because a B-tree serves
only **one** range as an access predicate — two independent ranges can't both
seek.

```txt
idx_last (last_name)          <- merged...
idx_dob  (date_of_birth)      <- ...instead of one composite
```

Fix: replace the pair with one composite index, most-selective column first.
Treat a standing `index_merge` plan as a MISSING-composite signal.

### COVERING opportunity

The query selects only columns that already live in (or could be added to) the
index, so MySQL can answer it from the index alone (`Extra: Using index`, an
"index-only scan"). Suggest extending the composite index to include the
selected columns. Remember the PK columns are already present (see the InnoDB
note above) — a select of indexed columns plus PK is covered as-is.

> [!NOTE]
> In PostgreSQL this is the `INCLUDE` clause
> (`CREATE INDEX ... INCLUDE (col)`). In MySQL there is no `INCLUDE`; you
> make an index covering by adding the columns to the index key itself.

### GENERATED-COLUMN candidate

When a query repeatedly filters or sorts on the **result of a function**
(`JSON_EXTRACT(...)`, `LENGTH(...)`, a concatenation), MySQL cannot index the
raw expression in a `WHERE`. Recommend a **generated column** plus an index on
it, then pick the storage type per the guide below.

```sql
-- Slow: full scan, the JSON path is computed per row
SELECT * FROM events WHERE JSON_EXTRACT(data, '$.id') = 10;

-- Fix: extract into a generated column and index it
ALTER TABLE events
  ADD COLUMN event_id INT
    GENERATED ALWAYS AS (JSON_EXTRACT(data, '$.id')) STORED;
CREATE INDEX idx_events_event_id ON events (event_id);
```

A descending generated-column index also removes a sort step for
"longest/largest first" queries:

```sql
-- Query pattern: ORDER BY LENGTH(path_pattern) DESC LIMIT 10
ALTER TABLE path_groups
  ADD COLUMN path_pattern_length INT
    GENERATED ALWAYS AS (LENGTH(path_pattern)) STORED;
CREATE INDEX idx_version_matchtype_length
  ON path_groups (version_id, match_type, path_pattern_length DESC);
-- The DESC index lets MySQL read longest-first from the start of the index,
-- eliminating "Using filesort".
```

#### VIRTUAL vs STORED

Both store the *definition*; they differ in when the value is computed and
whether it is materialized on disk.

| Type      | On disk | Computed                     | Choose when                                                              |
| --------- | :-----: | ---------------------------- | ------------------------------------------------------------------------ |
| `VIRTUAL` |   No    | On read (`SELECT`)           | Default. Cheap expressions; write-heavy / read-light tables; saves space |
| `STORED`  |   Yes   | On write (`INSERT`/`UPDATE`) | Expensive expressions; read-heavy tables; sorting on the value           |

- `VIRTUAL` is the default — zero extra storage and no write amplification, and
  the on-the-fly cost is negligible for cheap expressions (concatenation, basic
  math).
- `STORED` moves heavy computation to write time so reads stay instant — pick it
  for expensive expressions and tables read far more than written.
- `STORED` gives a static, physical value that indexes (and `ORDER BY ... DESC`)
  can scan cleanly, so prefer it when sorting or aggregating on the generated
  value — as the `path_pattern_length` example above does.

> [!NOTE]
> MySQL can index a `VIRTUAL` column too (it builds a hidden index structure
> behind the scenes), but `STORED` materializes the value in the row itself —
> the more reliable choice for turning an un-indexable function result into
> static, searchable data.

### SORT-ORDER — filesort from an unsatisfiable ORDER BY

An `ORDER BY` whose columns and directions don't match an index's leading
columns forces a `Using filesort` step. A mixed-direction sort
(`ORDER BY a ASC, b DESC`) needs an index that declares those directions per
column; a plain `(a, b)` index can't serve it.

```sql
-- Needs a direction-matched index, else filesort:
SELECT ... FROM sales ORDER BY sale_date ASC, product_id DESC;
CREATE INDEX idx_sales_dt_pr ON sales (sale_date ASC, product_id DESC);
```

> [!IMPORTANT]
> Descending index columns require **MySQL 8.0+** — before 8.0 (and MariaDB
> before 10.8) the `DESC` keyword parses but is ignored, so the index is stored
> ascending and the mixed-direction sort still filesorts. Confirm the server
> version before recommending a directional index. MySQL 8.0 also has no
> `NULLS FIRST/LAST`; `NULL`s sort first ascending, last descending.

### PAGINATION — deep OFFSET scan

`LIMIT n OFFSET m` makes MySQL read and discard all `m` skipped rows every call,
so response time grows with page depth; concurrent inserts also shift the
window, duplicating or skipping rows across pages. Flag any large or user-driven
`OFFSET`.

Fix: **keyset (seek) pagination** — carry the last row's sort key forward and
seek past it with a row-value comparison, backed by an index on the sort
columns. Constant time per page, stable under inserts.

```sql
-- Instead of: ORDER BY sale_date DESC LIMIT 10 OFFSET 10000
CREATE INDEX idx_sales_dt_id ON sales (sale_date, sale_id);
SELECT * FROM sales
 WHERE (sale_date, sale_id) < (?, ?)   -- last row of previous page
 ORDER BY sale_date DESC, sale_id DESC
 LIMIT 10;
```

The trailing key column (`sale_id`) makes the order deterministic so rows
sharing a `sale_date` aren't skipped at the page boundary.

## Step 4 — Report

Present findings grouped by severity (High / Medium / Low). For each finding
include:

- The index definition (`file:line`) with its ordered columns
- The offending query (`file:line`)
- The classification (UNUSED / PARTIAL / RANGE-ORDER / KILLER / REDUNDANT /
  MISSING / INDEX-MERGE / COVERING / GENERATED-COLUMN / SORT-ORDER / PAGINATION)
- **Why it matters** (one line)
- A **concrete fix** (reorder index columns, add a column to the query, add an
  index, rewrite the predicate, add a generated column, drop a redundant index)

Suggested skeleton:

```markdown
## MySQL Index Audit

**Scope:** <path | branch-diff | uncommitted>
**Indexes found:** <n>   **Query sites found:** <n>

### High — index unused / partially used

- **UNUSED** `users.idx_name_country_state (last_name, country, state)`
  (`db/schema.sql:42`)
  - Query `WHERE country = 'UK'` (`internal/users/repo.go:88`) skips the
    leftmost column `last_name` -> full table scan.
  - **Fix:** add an index leading with `country`, or reorder predicates to
    include `last_name`.

### Medium — killers, range ordering, missing indexes

...

### Low — redundant indexes, covering opportunities

...

### Needs manual EXPLAIN (dynamic queries)

- `internal/search/builder.go:120` — WHERE clause built conditionally; columns
  unknown statically.
```

### Verify with EXPLAIN

Because the audit is static, end the report with the commands the user runs
against a live database to confirm each finding:

```sql
-- Confirm which index (if any) the optimizer picks, and how:
EXPLAIN SELECT ...;          -- check: key vs possible_keys, type, Extra
EXPLAIN ANALYZE SELECT ...;  -- real row counts and timing (MySQL 8.0.18+)

-- Find the slow queries to prioritise first:
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
SET GLOBAL long_query_time = 0.5;
SET GLOBAL slow_query_log = 'ON';
```

## Reference: reading EXPLAIN

See [EXPLAIN-REFERENCE.md](EXPLAIN-REFERENCE.md) for criteria on interpreting
`EXPLAIN` output (`type`, `key` vs `possible_keys`, `Extra` flags,
leftmost-prefix rule).

## Agent teams (if your harness supports it)

If your harness supports parallel subagents, run Step 1 (index inventory) and
Step 2 (query inventory) as two concurrent subagents over the same file set,
then correlate their results in Step 3. This is faster on large codebases. On a
single-agent harness, run the steps sequentially — the result is identical.

Both inventory steps are mechanical file reads — run them on the cheapest model
tier adequate to the task (see
[`../shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md)).

## References

- Source notes:
  <https://gist.github.com/Integralist/51ae85eb6f522a6e8399cacefa385258>
  (`Explain.md`, `Indexes.md`, `Virtual Columns.md`)
- MySQL `EXPLAIN` output:
  <https://dev.mysql.com/doc/refman/8.0/en/explain-output.html>
- Generated columns:
  <https://dev.mysql.com/doc/refman/8.0/en/create-table-generated-columns.html>
- SQL indexing reference (access vs filter predicates, clustered indexes, keyset
  pagination): <https://use-the-index-luke.com/>
