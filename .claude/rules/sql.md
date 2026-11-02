---
paths:
  - '**/*.sql'
---

> [!NOTE]
> If invoked directly with no specific task, load these conventions and stop.
> They are ready to apply when asked to design, write, or edit SQL.

Write migrations as literal statements a DBA can read top to bottom and apply.
Most rules below concern migrations; formatting applies to all SQL. Examples
use MySQL 8.0. The principles apply to any engine; syntax notes may not.

## Migration statements

**Keep DDL simple.** Write a short sequence of literal statements, each exactly
what the database will run. DBAs may apply them by hand, feed them to online
schema-change tools, or diff them in review; all need the real statement in
the file.

```sql
ALTER TABLE users
    ADD COLUMN `email_reversed` VARCHAR(255)
    AS (SUBSTRING(REVERSE(`email`), 1, 255)) VIRTUAL
    AFTER `email`;

ALTER TABLE users
    ADD INDEX idx_account_email_reversed (`account_id`, `email_reversed`);
```

**Do not use control flow.** Migrations contain DDL and comments only. Do not
hide statements with `PREPARE`/`EXECUTE`, feeding `SET @var`, `IF()` or `CASE`,
string concatenation, `GROUP_CONCAT`, `information_schema` gates, loops, or
`BEGIN` blocks. Dynamic SQL cannot be diffed or dry-run; gh-ost and
pt-online-schema-change take a single `ALTER`, not a `PREPARE` block. Put such
logic in application code or a runbook.

**Let the runner handle idempotency and verification.** The runner records
applied versions and runs each migration once, so write against the schema
left by earlier migrations. Use inline `IF EXISTS` or `IF NOT EXISTS` only
where the engine supports it and the guard matters. MySQL supports these for
`DROP TABLE`, `DROP INDEX`, and `CREATE TABLE`, not `ALTER TABLE … ADD COLUMN`
or `DROP COLUMN`; use the bare statement rather than an emulated guard. End
the file after the last DDL statement. A failed statement aborts the
migration and shows the error; do not add `SELECT`s that re-check
`information_schema`.

**Batch changes.** Use one `ALTER` per table so the table is rebuilt once.
Order separate statements by dependency: drop unreferenced tables first and
add a column before an index that uses it.

```sql
ALTER TABLE jobs
    DROP INDEX idx_queue_shard,
    DROP COLUMN shard_number;
```

**Document risk.** Start with a header stating what the migration does, its
ticket, and any DBA-relevant risk when choosing how to apply it: table rewrite
versus instant metadata change, locks, row-count sensitivity, or
online-schema-change compatibility. Comment inline only when the DDL's intent
isn't clear. If a comment would describe a simpler alternative, use that
simpler statement instead.

```sql
-- Migration: add email_reversed generated column and index
-- Ticket: ABC-1234
--
-- Turns suffix matching into a prefix scan on the reversed column. The column
-- is VIRTUAL, so this is an instant metadata change with no row storage; the
-- index build is the only expensive part.
```

**Keep data work out.** Migrations change schema. Run backfills, rewrites, and
cleanups as batched application code or documented procedures that can be
throttled, resumed, and monitored. A migration loop has none of that and holds
the migration lock while it runs. If plain DDL is insufficient, split the
change into ordered migrations or give the DBA steps for their chosen tooling.
Talk to the DBA rather than writing procedural SQL.

## Formatting

- One statement per intent, each ending in `;`.
- Uppercase keywords and `snake_case` identifiers.
- When a statement exceeds one line, put each clause on its own indented line.
- Quote identifiers consistently as the surrounding schema does (for example,
  MySQL backticks).
- Follow the repo's migration numbering, naming, and rollback scheme.
- Name every index and constraint explicitly, using existing prefixes
  (commonly `idx_` for secondary indexes and `uq_` for unique indexes).
