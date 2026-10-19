---
name: cleanup
description: >-
  Audit a codebase or paths for AI slop and clean it up with you steering each
  fix. Use when asked to find and remove sloppy, AI-generated code patterns.
disable-model-invocation: true
argument-hint: '[path | glob]'
metadata:
  model-tier: moderate
---

# Cleanup

Find AI slop in a codebase and fix it in two phases: a read-only subagent
audits the files and returns a proposed-fix list, then you apply the fixes in
the main thread with the user. The split is deliberate: the auditor ranges
across many files in one pass, while every edit lands where the user can veto
or adjust it, so there's no large diff to unwind at the end. Follow
[SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md), including its
completion and retry protocol.

1. **Gather the files.** With no argument, take every source file, excluding
   vendored, generated, and fixture directories such as `vendor/`,
   `node_modules/`, `testdata/`, and `.git/`. With a path or glob, expand it
   and check the paths exist. If nothing is found, report "No files to
   review" and stop. Done when you have the file list.
2. **Find the high-risk files** so the audit starts with them. Files in both
   lists below are the highest risk; flag them.

   ```bash
   # Churn: most-changed files in the last year.
   git log --format=format: --name-only --since="1 year ago" \
     | sort | uniq -c | sort -nr | head -20
   # Bug clusters: files most often touched by fix commits.
   git log -i -E --grep="fix|bug|broken" \
     --name-only --format='' | sort | uniq -c | sort -nr | head -20
   ```

   Done when you have both lists and their overlap.
3. **Spawn one read-only audit subagent,** in the background if your harness
   supports agent teams (see [AGENT-TEAMS.md](../shared/AGENT-TEAMS.md)). Give
   it the file list, the high-risk files to examine first, and the audit
   prompt below, with the checklist verbatim. Done when it has returned the
   fix list and a count of files with no issues.
4. **Apply the fixes with the user.** Present the list grouped by class, then
   category, so the user sees the scope before anything changes. Apply safe
   fixes, raising any you're second-guessing. Show each behaviour-changing fix
   and apply it only once the user approves or modifies it. When an applied
   fix changes behaviour, a public API, or usage, update the docs or READMEs
   the auditor flagged, creating a new doc only for a wholly new component.
   Honour "skip", "change approach", or "stop" immediately. Done when every
   fix is applied or skipped, and you've tracked which.
5. **Write the report** to `docs/reports/<YYYY-MM-DD-HHMM>-cleanup.md`
   (`mkdir -p docs/reports` first) in the shape below, then give a short
   summary and the path in chat. Done when the report is written.

**Audit prompt.**

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

**Report.**

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
