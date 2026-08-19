---
paths:
  - '**/*.sql'
---

> [!NOTE]
> If you were invoked directly (e.g. `/conventions-sql`) with no specific task,
> just read this skill so its conventions are loaded into context, then stop —
> there is nothing to do yet. They're now ready to apply when I ask you to
> design, write, or edit SQL.

We are peers writing SQL. Prioritize the reader who has to apply it.

Most of this skill is about **migration files** — the schema changes a DBA
reviews and applies. **Formatting** applies to all SQL. Examples are MySQL 8.0;
the principles hold on any engine, the syntax notes do not.

## Simple DDL

Write migrations as **simple DDL**: a short sequence of literal statements, each
one exactly what the database will run. A DBA reads the file top to bottom and
knows the change. That readability is the requirement — DBAs apply these by
hand, feed them to online-schema-change tooling, and diff them in review, and
all three need the statement written out in the file.

```sql
ALTER TABLE users
    ADD COLUMN `email_reversed` VARCHAR(255)
    AS (SUBSTRING(REVERSE(`email`), 1, 255)) VIRTUAL
    AFTER `email`;

ALTER TABLE users
    ADD INDEX idx_account_email_reversed (`account_id`, `email_reversed`);
```

Everything below follows from this.

## Idempotency belongs to the runner

The migration runner keeps a ledger of applied versions and runs each file once.
Write the change assuming the schema is in the state the previous migrations
left it in.

Inline `IF EXISTS` / `IF NOT EXISTS` clauses are simple DDL — one statement, no
control flow — so use them where the engine supports them and the guard is
load-bearing:

```sql
DROP TABLE IF EXISTS `job_shards`;
```

MySQL supports the clause on `DROP TABLE`, `DROP INDEX`, and `CREATE TABLE`, but
not on `ALTER TABLE ... ADD COLUMN` or `DROP COLUMN`. Where the engine has no
inline guard, write the bare statement — reaching for `information_schema` to
emulate one is how a migration stops being simple DDL.

## Keep control flow out of migrations

A migration file contains DDL statements and comments. Every statement is
literal — the text in the file is the text that executes.

These constructs make the executed statement invisible in the file, so they
belong in application code or an operational runbook, never in a migration:

- `PREPARE` / `EXECUTE` / `DEALLOCATE PREPARE`, and the `SET @var` assignments
  that feed them.
- `IF()` or `CASE` used to pick which statement runs.
- `GROUP_CONCAT` or any string concatenation that assembles DDL.
- `information_schema` lookups that gate a change.
- Loops, `WHILE`, and `DO`/`BEGIN` blocks.

The cost is concrete: dynamic SQL can't be reviewed as a diff, can't be
dry-run, and online-schema-change tools (gh-ost, pt-online-schema-change) take a
single `ALTER` — they have nothing to do with a `PREPARE` block.

## One ALTER per table

Batch every change to the same table into one `ALTER`, so the table is rebuilt
once instead of once per clause:

```sql
ALTER TABLE jobs
    DROP INDEX idx_queue_shard,
    DROP COLUMN shard_number;
```

Separate statements per table, in dependency order — drop the table with no
foreign keys pointing at it first, add the column before the index that
references it.

## Verification is the runner's job

End the file after the last DDL statement. A failed statement aborts the
migration and surfaces the error; that is the verification. Trailing `SELECT`
statements that re-query `information_schema` to confirm the change emit result
sets that migration runners and CI tooling then have to interpret.

## Comments

Open with a short header: what the migration does, the ticket, and any
operational risk the DBA needs before they choose how to apply it — table
rewrite versus instant metadata change, expected lock behaviour, row-count
sensitivity, online-schema-change compatibility.

```sql
-- Migration: add email_reversed generated column and index
-- Ticket: ABC-1234
--
-- Turns suffix matching into a prefix scan on the reversed column. The column
-- is VIRTUAL, so this is an instant metadata change with no row storage; the
-- index build is the only expensive part.
```

Keep inline comments to the statements whose intent isn't on the face of the
DDL. Where a comment would describe a simpler alternative to the statement
below it, write the simpler statement instead.

## Data changes

Migrations change schema. Backfills, rewrites, and cleanups that touch rows run
as batched application code or a documented operational procedure, where they
can be throttled, resumed, and monitored — a loop inside a migration file has
none of that, and it holds the migration lock while it runs.

## When simple DDL isn't enough

Split the change into ordered migrations, or hand the DBA a sequence of steps to
run with the tooling they choose. A change that resists plain statements is a
signal to talk to the DBA, not to reach for procedural SQL.

## Formatting

- One statement per intent, each terminated with `;`.
- Uppercase SQL keywords; `snake_case` identifiers.
- Break clauses onto their own lines, indented, once a statement exceeds one
  line.
- Quote identifiers the way the surrounding schema does — MySQL backticks
  applied consistently within a file.
- Follow the repo's existing migration file numbering, naming, and down/rollback
  scheme rather than introducing one.
- Match the index naming already in the schema (commonly `idx_` for secondary,
  `uq_` for unique), and name every index and constraint explicitly.

## Before / after

The anti-pattern — an existence check driving a built statement, repeated for
each column and index the migration touches:

```sql
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'email_reversed'
);

SET @add_col = IF(
    @col_exists = 0,
    'ALTER TABLE users ADD COLUMN `email_reversed` ...',
    'SELECT "Column already exists" AS status'
);

PREPARE stmt FROM @add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

The same migration as simple DDL:

```sql
ALTER TABLE users
    ADD COLUMN `email_reversed` VARCHAR(255)
    AS (SUBSTRING(REVERSE(`email`), 1, 255)) VIRTUAL
    AFTER `email`;
```
