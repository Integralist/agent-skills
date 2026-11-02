# MySQL Index Audit: Inventory Guide

**Parallel inventories.** Steps 1 and 2 are independent, mechanical reads of
the same files. When the harness supports subagents, run them as two
concurrent subagents on the cheapest adequate tier, following
[SUBAGENT-STEERABILITY.md](../../shared/SUBAGENT-STEERABILITY.md) and its
completion and retry protocol, then correlate their results before
classifying; otherwise run them in turn.

1. **Inventory the indexes,** one record each:

   ```txt
   { table, index_name, ordered_columns[], unique?, source_file:line }
   ```

   Column order is the datum the whole audit hinges on, so copy it verbatim:
   a wrong order here makes every finding downstream wrong. Search with `rg`:
   - **Raw DDL** in migrations, `*.sql`, and SQL strings:
     `CREATE\s+(UNIQUE\s+)?INDEX`, `ADD\s+(UNIQUE\s+)?(INDEX|KEY)`,
     `PRIMARY\s+KEY`, and inline `(UNIQUE\s+)?(INDEX|KEY)\s+` in a
     `CREATE TABLE` body.
   - **GORM:** tags `gorm:"index"`, `gorm:"uniqueIndex"`,
     `index:idx_name,priority:N`. Composite order comes from `priority`, not
     source position.
   - **Rails:** `add_index`, `t.index`. **Django:** `Meta.indexes`,
     `index_together`, `db_index=True`, `unique_together`.
     **Sequelize/TypeORM:** `@Index(`, `indexes: [`.
     **SQLAlchemy/Alembic:** `Index(`, `op.create_index(`. **Ecto:**
     `create index(`, `create unique_index(`.

   Elsewhere, a composite's declared column order is its index order. Done
   when every definition has a record.
2. **Inventory the queries,** one record each:

   ```txt
   {
     table,
     predicate_columns[],
     operators[],
     order_by_columns[],
     select_columns[]
   }
   ```

   `operators[]` marks each predicate column as equality (`=`, `IN`), range
   (`>`, `<`, `>=`, `<=`, `BETWEEN`, `LIKE 'x%'`), or a killer (step 3).
   Search raw SQL (`SELECT`, `WHERE`, `JOIN`, `ORDER BY`, `GROUP BY` in
   strings and `*.sql`) and query builders (`.where(`, `.filter(`, `Where(`,
   `find_by`, `.eq(`, `.in(`, `.order(`, `where:`, and the ORM's own forms).
   - **Dynamic WHERE clauses,** whose columns depend on runtime input, can't
     be resolved statically: list them under "Needs manual EXPLAIN" with
     `file:line` rather than guessing. A static `OR :p IS NULL` catch-all is
     fully visible, so it's a KILLER, not this.
   - **CTEs and derived tables** are merged into the outer query by default,
     so their predicates use base-table indexes; inventory them normally. A
     body with `GROUP BY`, `DISTINCT`, `HAVING`, `LIMIT`, `UNION`, or an
     aggregate or window function, and every recursive CTE, is materialised
     into an unindexed temp table (`<derivedN>` in `EXPLAIN`, perhaps with an
     `auto_key0`). List one that's filtered or joined after such a construct
     under "Needs manual EXPLAIN".

   Done when every query site has a record or a "Needs manual EXPLAIN" entry.
