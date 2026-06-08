---
name: mysql-index-audit
description: >-
  Audit a codebase for MySQL index correctness. Finds composite
  indexes broken by leftmost-prefix violations, queries that only
  partially use an index (index gaps), and index killers (leading
  wildcards, function-wrapped columns, type mismatches). Static
  analysis of schema + query code; reports EXPLAIN follow-ups.
user-invocable: true
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
> `EXPLAIN` against the actual generated SQL.

## Step 3 — Correlate and classify

For each query, match it against the indexes on the same table and classify it.
The classifications below are the core of the audit.

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

### RANGE-then-equality ordering

A range predicate (`>`, `<`, `BETWEEN`, `LIKE 'x%'`) on an index column stops
the index from being used for columns **to its right**. Optimal composite order
is **equality columns first, range column last**.

```sql
-- Index:  (status, created_at)  <- good: equality then range
SELECT * FROM orders WHERE status = 'active' AND created_at > '2026-01-01';

-- Index:  (created_at, status)  <- bad: range first kills `status` seeking
```

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

### COVERING opportunity

The query selects only columns that already live in (or could be added to) the
index, so MySQL can answer it from the index alone (`Extra: Using index`, an
"index-only scan"). Suggest extending the composite index to include the
selected columns.

> [!NOTE]
> In PostgreSQL this is the `INCLUDE` clause
> (`CREATE INDEX ... INCLUDE (col)`). In MySQL there is no `INCLUDE`; you
> make an index covering by adding the columns to the index key itself.

### GENERATED-COLUMN candidate

When a query repeatedly filters or sorts on the **result of a function**
(`JSON_EXTRACT(...)`, `LENGTH(...)`, a concatenation), MySQL cannot index the
raw expression in a `WHERE`. Recommend a **generated column** plus an index on
it. Prefer `STORED` when the value is read often and the table is read-heavy.

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

## Step 4 — Report

Present findings grouped by severity (High / Medium / Low). For each finding
include:

- The index definition (`file:line`) with its ordered columns
- The offending query (`file:line`)
- The classification (UNUSED / PARTIAL / RANGE-ORDER / KILLER / REDUNDANT /
  MISSING / COVERING / GENERATED-COLUMN)
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

Inline criteria for interpreting the `EXPLAIN` output the user gathers.

### `type` — access method (fastest to slowest)

| `type`             | Meaning                                                   |
| ------------------ | --------------------------------------------------------- |
| `system` / `const` | Exactly one row, found instantly (primary-key lookup).    |
| `eq_ref`           | One-row join match on a unique/primary key.               |
| `ref`              | Index lookup returning several rows.                      |
| `range`            | Index slice (`BETWEEN`, `IN`, `>`, `<`).                  |
| `index`            | Full **index** scan — entire index read.                  |
| `ALL`              | Full **table** scan — every row read. Usually the target. |

> [!NOTE]
> `ALL` is acceptable when the `table` is a small derived/temporary result
> (`<derivedN>`, `<unionM,N>`) with a low `rows` count — MySQL is scanning a
> small in-memory set it just built.

### `key` vs `possible_keys`

- `possible_keys` — indexes that *could* match the `WHERE`/`JOIN`. `NULL`
  means no index matches at all (a strong leftmost-prefix smell).
- `key` — the index actually chosen. If `possible_keys` lists an index but
  `key` is `NULL`, the optimizer judged a full scan cheaper (common on small
  tables or when reading a large fraction of rows).

### `Extra` — red flags and green lights

| Flag                       | Verdict  | Meaning                                            |
| -------------------------- | -------- | -------------------------------------------------- |
| `Using index`              | Good     | Covering index — answered from the index alone.    |
| `Using index condition`    | Good     | Index Condition Pushdown — filtered at storage.    |
| `Using index for group-by` | Good     | Loose index scan.                                  |
| `Using where`              | Neutral  | Filtered after fetch; worrying if `type` is `ALL`. |
| `Using intersect(...)`     | Neutral  | Index merge — a composite index is usually better. |
| `Using filesort`           | Bad      | Manual sort; index order didn't match `ORDER BY`.  |
| `Using temporary`          | Bad      | Internal temp table (often `UNION`/`DISTINCT`).    |
| `Dependent Subquery`       | Very bad | Subquery runs once per outer row.                  |

### Leftmost-prefix rule

An index on `(A, B, C)` can serve queries on `(A)`, `(A, B)`, or `(A, B, C)`. It
**cannot** serve a query on only `(B)`, only `(C)`, or `(B, C)`. The `WHERE`
clause order is irrelevant; column **presence** of the leftmost prefix is what
matters.

## Agent teams (if your harness supports it)

If your harness supports parallel subagents, run Step 1 (index inventory) and
Step 2 (query inventory) as two concurrent subagents over the same file set,
then correlate their results in Step 3. This is faster on large codebases. On a
single-agent harness, run the steps sequentially — the result is identical.

## References

- Source notes:
  <https://gist.github.com/Integralist/51ae85eb6f522a6e8399cacefa385258>
  (`Explain.md`, `Indexes.md`, `Virtual Columns.md`)
- MySQL `EXPLAIN` output:
  <https://dev.mysql.com/doc/refman/8.0/en/explain-output.html>
- Generated columns:
  <https://dev.mysql.com/doc/refman/8.0/en/create-table-generated-columns.html>
