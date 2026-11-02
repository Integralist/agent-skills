# Reference: MySQL Index Classifications

## Classifications

> [!IMPORTANT]
> InnoDB secondary indexes implicitly carry the primary-key columns: the
> table is its PK index, so `(a)` is physically `(a, <pk>)`. A query
> selecting only the index's columns plus the PK is already covered, so
> never recommend adding the PK. A wide or natural PK bloats every secondary
> index and slows writes, so flag it as a cost multiplier.

**UNUSED: leftmost-prefix violation.** The query filters on indexed columns
but not the index's leftmost one, so the index can't be used and MySQL scans
the table (`type: ALL`). Fix by reordering the index or adding one that leads
with the queried column.

```sql
-- Index (last_name, country, state): skips last_name, so unusable
SELECT * FROM users WHERE country = 'UK';
```

**PARTIAL: index gap.** The query uses the leftmost columns but skips one in
the middle, so MySQL seeks up to the gap and scans the rest. Predicate order
in `WHERE` doesn't matter, since the optimizer reorders them; only which
leading columns are present does. Fix with an index matching the query's
columns; add a skipped predicate only when the contract already requires it.

```sql
-- Index (last_name, country, state): seeks last_name only, then scans
-- every 'Smith' for state, because country is missing
SELECT * FROM users WHERE last_name = 'Smith' AND state = 'California';
```

**RANGE-ORDER: equality before range.** A range predicate stops the index
being used for every column to its right: columns the index seeks on are
access predicates (they lengthen `key_len`), and those after a range become
filter predicates, read then discarded (`Using where`). So put equality
columns first and one range last; with several ranges, only one benefits, so
put the most selective last.

```sql
-- BAD: only created_at is seekable; country is filtered row by row
CREATE INDEX idx_users_created_country ON users (created_at, country);
-- GOOD: seeks country = 'UK', then range-scans created_at within it
CREATE INDEX idx_users_country_created ON users (country, created_at);

SELECT * FROM users WHERE country = 'UK' AND created_at >= '2026-01-01';
```

**KILLER.** These force a scan even with a matching index:

- **Leading wildcard:** `LIKE '%smith'` — preserve suffix matching and
  assess index options.
- **Function wrap:** `WHERE YEAR(d) = 2026` — use a range such as
  `WHERE d >= '2026-01-01' AND d < '2027-...'`.
- **Function wrap:** `WHERE LOWER(name) = 'pikachu'` — use a functional index
  or generated column.
- **Type mismatch:** `WHERE varchar_id = 123` — quote the value:
  `WHERE varchar_id = '123'`.

A type mismatch converts every row before comparing. A catch-all predicate,
`(col = ? OR ? IS NULL)` or `col = COALESCE(:p, col)`, makes the optimizer
plan for every filter turned off, so it picks a full scan and keeps it even
when a value is given. Fix it by building the WHERE clause from only the
supplied predicates, still with bind parameters, so each shape gets its own
plan.

**REDUNDANT.** An index that's a leftmost prefix of another, such as
`(user_id)` beside `(user_id, created_at)`, is a drop candidate. Say in the
report that dropping it speeds writes, since every insert, update, and delete
maintains each index.

**MISSING.** A frequent `WHERE` or `JOIN` predicate has no index leading with
its column; recommend a composite, equality columns first. A nested-loops
join probes the driven table once per driving row, so an unindexed join or
foreign-key column on that side is MISSING too.

**INDEX-MERGE.** MySQL can intersect scans of separate indexes for `AND` and
union them for `OR`. That's a plan to confirm with `EXPLAIN` and
`EXPLAIN ANALYZE`, not proof of a defect. For `AND`, compare it with a
composite ordered for the query. For `OR` across columns, the merge may be
right, and a `UNION` rewrite is a measured alternative: keep the original row
set by applying global `ORDER BY`/`LIMIT` to the combined result, and
deduplicate by row identity or make the branches disjoint (`UNION` removes
duplicate tuples; `UNION ALL` keeps them).

**COVERING.** The query selects only columns the index holds or could hold,
so MySQL can answer from the index alone (`Using index`). Suggest adding the
selected columns to the index key; MySQL has no PostgreSQL-style `INCLUDE`.

**GENERATED-COLUMN.** A query that filters or sorts on a function result
(`JSON_EXTRACT`, `LENGTH`, a concatenation) can't use an index on the raw
column. Recommend a generated column with an index:

```sql
-- Slow: the JSON path is computed per row
SELECT * FROM events WHERE JSON_EXTRACT(data, '$.id') = 10;

ALTER TABLE events
  ADD COLUMN event_id INT
    GENERATED ALWAYS AS (JSON_EXTRACT(data, '$.id')) STORED;
CREATE INDEX idx_events_event_id ON events (event_id);

-- For ORDER BY LENGTH(path) DESC LIMIT 10, a DESC index reads longest-first
-- and removes "Using filesort"
ALTER TABLE routes
  ADD COLUMN path_length INT GENERATED ALWAYS AS (LENGTH(path)) STORED;
CREATE INDEX idx_routes_version_length ON routes (version_id, path_length DESC);
```

`VIRTUAL`, the default, computes on read with no extra storage or write cost,
so it suits cheap expressions and write-heavy tables. `STORED` computes on
write and keeps the value in the row, so it suits expensive expressions,
read-heavy tables, and sorting or aggregating on the value. MySQL can index
either, but `STORED` is the more reliable way to make a function result
searchable.

**SORT-ORDER.** An `ORDER BY` whose columns and directions don't match an
index's leading columns forces `Using filesort`. A mixed-direction sort needs
an index that declares each direction, such as
`(sale_date ASC, product_id DESC)` for
`ORDER BY sale_date ASC, product_id DESC`. Descending index columns need
MySQL 8.0+ (MariaDB 10.8+); earlier versions parse `DESC` and ignore it, so
confirm the server version first. MySQL has no `NULLS FIRST/LAST`: `NULL`s
sort first ascending and last descending.

**PAGINATION.** `LIMIT n OFFSET m` reads and discards `m` rows on every call,
so it slows with depth, and concurrent inserts shift pages, duplicating or
skipping rows. Flag a large or user-driven `OFFSET` and recommend keyset
pagination, which is constant time per page and stable under inserts. The
trailing key column keeps rows that share a date from being skipped at a page
boundary:

```sql
CREATE INDEX idx_sales_dt_id ON sales (sale_date, sale_id);
SELECT * FROM sales
 WHERE (sale_date, sale_id) < (?, ?)   -- last row of the previous page
 ORDER BY sale_date DESC, sale_id DESC
 LIMIT 10;
```
