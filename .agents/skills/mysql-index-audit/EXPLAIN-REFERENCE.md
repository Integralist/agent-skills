# Reference: reading EXPLAIN

Inline criteria for interpreting the `EXPLAIN` output the user gathers.

## `type` — access method (fastest to slowest)

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

## `key` vs `possible_keys`

- `possible_keys` — indexes that *could* match the `WHERE`/`JOIN`. `NULL`
  means no index matches at all (a strong leftmost-prefix smell).
- `key` — the index actually chosen. If `possible_keys` lists an index but
  `key` is `NULL`, the optimizer judged a full scan cheaper (common on small
  tables or when reading a large fraction of rows).

## `Extra` — red flags and green lights

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

## Leftmost-prefix rule

An index on `(A, B, C)` can serve queries on `(A)`, `(A, B)`, or
`(A, B, C)`. It **cannot** serve a query on only `(B)`, only `(C)`, or
`(B, C)`. The `WHERE` clause order is irrelevant; column **presence** of
the leftmost prefix is what matters.
