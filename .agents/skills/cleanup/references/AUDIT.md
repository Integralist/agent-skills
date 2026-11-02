# Cleanup audit guide

## Risk-file commands

```bash
# Churn: most-changed files in the last year.
git log --format=format: --name-only --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
# Bug clusters: files most often touched by fix commits.
git log -i -E --grep="fix|bug|broken" \
  --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

## Audit prompt

Give the following prompt to the read-only subagent:

````md
You are a principal engineer auditing code for "AI slop": the signs of
AI-generated code accepted without proper review. This is a read-only audit:
edit no file, run no formatter, and change nothing in the workspace. Work file
by file, high-risk files first.

- Propose a concrete fix for each issue, without applying it.
- Classify each fix as `safe` (no behaviour change) or `behavior-changing`.
  Be aggressive about finding slop but conservative about "safe": when
  unsure, it's behavior-changing.
- Propose only changes that fit the language's and codebase's conventions.
- For a fix that alters behaviour, public APIs, or usage, name the
  `docs/**/*.md` or `**/README.md` files it would also need to update.

Return a JSON array of fixes, plus a count of files reviewed with no issues:

```json
{
  "file": "path/to/file",
  "line": "approx line or range",
  "category": "verbosity | duplication | comments | naming | structure | over-engineering",
  "class": "safe | behavior-changing",
  "what": "the current problem",
  "fix": "the concrete change to make",
  "docs": "docs/README files the fix also touches, or null"
}
```

What to look for:

- **Verbosity:** defensive checks that can't fire, error handling for
  impossible cases, redundant type assertions; wrappers that only forward a
  call; variables assigned once and immediately returned; `else` after a
  return.
- **Duplication:** copy-pasted logic to extract; near-identical switch arms
  to collapse; repeated string literals that should be constants.
- **Comments:** comments that restate the code; temporal comments ("added
  this to fix the bug"); leaked uncertainty ("actually", "but wait", "I
  think", "probably"); commented-out code.
- **Naming:** `result`, `data`, `temp`, `val`, `ret` where a descriptive name
  exists; booleans not named as predicates; inconsistent conventions within
  a file.
- **Structure:** functions over 50 lines doing several things; nesting over 3
  levels that early returns could flatten; dead code, unreachable branches,
  vestigial parameters; leftover temp files, debug prints, or scaffolding;
  unused imports.
- **Over-engineering:** abstractions or interfaces with one implementation or
  user; configuration for things that never vary; builders or factories where
  a constructor would do.
````

## Report template

Write the cleanup report in this shape:

````md
## Cleanup Report

- **Date:** YYYY-MM-DD HH:MM
- **Scope:** entire codebase | specific paths
- **Files reviewed:** <count>
- **Files changed:** <count>
- **Fixes applied:** <count>
- **Fixes skipped:** <count>

### Changes Applied

[By category. Each item: file, line, what changed.]

### Skipped / Deferred

[Each item: file, line, description, why it matters, the proposed fix.]
````
