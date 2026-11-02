# Reference: reading EXPLAIN

How to read the `EXPLAIN` output the user gathers for each finding.

## `type` — access method (fastest to slowest)

- **`system` / `const`:** Exactly one row, found instantly (primary-key
  lookup).
- **`eq_ref`:** One-row join match on a unique or primary key.
- **`ref`:** Index lookup returning several rows.
- **`index_merge`:** Two or more indexes merged for one table; prefer one
  composite when it suits the query.
- **`range`:** Index slice (`BETWEEN`, `IN`, `>`, `<`).
- **`index`:** Full index scan; the entire index is read.
- **`ALL`:** Full table scan; every row is read. Usually the target.

> [!NOTE]
> `ALL` is acceptable when the table is a small derived or temporary result
> (`<derivedN>`, `<unionM,N>`) with a low `rows` count. MySQL is scanning a
> small in-memory set it recently built.

## `key` vs `possible_keys`

- **`possible_keys`:** Indexes that could match the `WHERE` or `JOIN`. `NULL`
  means no index matches at all, a strong leftmost-prefix smell.
- **`key`:** The index actually chosen. If `possible_keys` lists an index but
  `key` is `NULL`, the optimizer judged a full scan cheaper. This is common
  on small tables or when reading a large fraction of rows.
- **`key_len`:** Bytes of the index actually used to seek. It counts only the
  **access-predicate** columns, those setting scan start/stop points. A
  `key_len` shorter than the full composite index means the leftmost prefix
  stops short: a column is missing or a range halted traversal (PARTIAL or
  RANGE-ORDER).

## `Extra` — red flags and green lights

- **`Using index` — Good:** Covering index; answered from the index alone.
- **`Using index condition` — Good:** Index Condition Pushdown; filtered at
  storage.
- **`Using index for group-by` — Good:** Loose index scan.
- **`Using where` — Neutral:** Filtered after fetch; worrying if `type` is
  `ALL`.
- **`Using intersect(...)` — Neutral:** Index merge for `AND`; a composite
  is usually better.
- **`Using union(...)` — Neutral:** Index merge for `OR`; a composite is
  usually better.
- **`Using filesort` — Bad:** Manual sort; index order didn't match
  `ORDER BY`.
- **`Using temporary` — Bad:** Internal temp table, often for `UNION` or
  `DISTINCT`.
- **`Dependent Subquery` — Very bad:** Subquery runs once per outer row.
