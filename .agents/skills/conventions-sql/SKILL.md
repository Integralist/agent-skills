---
name: conventions-sql
description: >-
  MANDATORY for any work on SQL files (*.sql). Load this before editing or
  creating any *.sql file. SQL migration conventions covering simple DDL,
  idempotency, batching ALTER statements, comments, and formatting.
metadata:
  model-tier: moderate
---

> [!NOTE]
> If you were invoked directly (e.g. `/conventions-sql`) with no specific task,
> just read this skill so its conventions are loaded into context, then stop —
> there is nothing to do yet. They're now ready to apply when I ask you to
> design, write, or edit SQL.

# SQL Conventions

Write migrations a DBA can read top to bottom and apply. Most of this skill
covers migration files; Formatting applies to all SQL. Examples are MySQL 8.0:
the principles hold on any engine, the syntax notes don't.

**Simple DDL.** Write each migration as a short sequence of literal
statements, each exactly what the database will run. DBAs apply migrations by
hand, feed them to online-schema-change tools, and diff them in review, and
all three need the real statement written in the file. Everything below
follows from this.

```sql
ALTER TABLE users
    ADD COLUMN `email_reversed` VARCHAR(255)
    AS (SUBSTRING(REVERSE(`email`), 1, 255)) VIRTUAL
    AFTER `email`;

ALTER TABLE users
    ADD INDEX idx_account_email_reversed (`account_id`, `email_reversed`);
```

**No control flow.** A migration holds only DDL and comments. Keep out
anything that hides the statement that runs: `PREPARE`/`EXECUTE` and the
`SET @var` that feeds them, `IF()` or `CASE` choosing a statement, string
concatenation or `GROUP_CONCAT` building DDL, `information_schema` lookups
gating a change, and loops or `BEGIN` blocks. Dynamic SQL can't be diffed or
dry-run, and gh-ost and pt-online-schema-change take a single `ALTER`, not a
`PREPARE` block. Those constructs belong in application code or a runbook.

```sql
-- Bad: an existence check building the statement.
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'email_reversed');
SET @add_col = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN `email_reversed` ...',
    'SELECT "Column already exists" AS status');
PREPARE stmt FROM @add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Good: the statement itself.
ALTER TABLE users
    ADD COLUMN `email_reversed` VARCHAR(255)
    AS (SUBSTRING(REVERSE(`email`), 1, 255)) VIRTUAL
    AFTER `email`;
```

**Idempotency is the runner's job.** The runner records applied versions and
runs each file once, so write the change against the schema the previous
migrations left. Use an inline `IF EXISTS` or `IF NOT EXISTS` where the engine
supports it and the guard matters (`DROP TABLE IF EXISTS job_shards;`). MySQL
supports it on `DROP TABLE`, `DROP INDEX`, and `CREATE TABLE`, not on
`ALTER TABLE … ADD COLUMN` or `DROP COLUMN`; there, write the bare statement
rather than emulate a guard with `information_schema`.

**Verification is the runner's job too.** End the file after the last DDL
statement. A failed statement aborts the migration and shows the error. Don't
add trailing `SELECT`s that re-check `information_schema`; runners and CI then
have to interpret their result sets.

**One ALTER per table.** Batch every change to a table into one `ALTER`, so
the table is rebuilt once, not once per clause. Order separate statements by
dependency: drop a table nothing references first, and add a column before
the index that uses it.

```sql
ALTER TABLE jobs
    DROP INDEX idx_queue_shard,
    DROP COLUMN shard_number;
```

**Comments.** Open with a header: what the migration does, the ticket, and any
risk the DBA needs before choosing how to apply it, such as a table rewrite
versus an instant metadata change, lock behaviour, row-count sensitivity, or
online-schema-change compatibility. Comment inline only where a statement's
intent isn't clear from the DDL. If a comment would describe a simpler
alternative to the statement below it, write the simpler statement.

```sql
-- Migration: add email_reversed generated column and index
-- Ticket: ABC-1234
--
-- Turns suffix matching into a prefix scan on the reversed column. The column
-- is VIRTUAL, so this is an instant metadata change with no row storage; the
-- index build is the only expensive part.
```

**Data changes.** Migrations change schema. Run backfills, rewrites, and
cleanups as batched application code or a documented procedure that can be
throttled, resumed, and monitored; a loop in a migration has none of that and
holds the migration lock while it runs.

**When simple DDL isn't enough,** split the change into ordered migrations, or
give the DBA a sequence of steps to run with their chosen tooling. A change
that resists plain statements is a reason to talk to the DBA, not to write
procedural SQL.

## Formatting

- One statement per intent, each ending in `;`.
- Uppercase keywords and `snake_case` identifiers.
- Once a statement passes one line, put each clause on its own indented line.
- Quote identifiers the way the surrounding schema does, such as MySQL
  backticks, consistently within a file.
- Follow the repo's existing migration numbering, naming, and rollback scheme.
- Name every index and constraint explicitly, matching the schema's existing
  prefixes (commonly `idx_` for secondary and `uq_` for unique).
