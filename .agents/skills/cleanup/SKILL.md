---
name: cleanup
description: >-
  Review codebase for AI slop and clean it up. A read-only
  subagent audits files and produces a proposed fix list; the
  main thread then applies fixes interactively so you can steer
  each one.
disable-model-invocation: true
argument-hint: '[path | glob]'
---

# Cleanup Skill

Audit a codebase for AI slop in two phases:

1. **Audit (subagent, read-only)** — a subagent examines the
   in-scope files and returns a structured list of proposed
   changes. It edits nothing.
1. **Apply (main thread, interactive)** — the main thread walks
   that list with you, applying fixes you approve and skipping the
   rest.

The split is deliberate: the auditor ranges across many files in
one pass, but every edit lands in the main thread where you can
veto or adjust it as it happens — no large diff to unwind at the
end. See
[`shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md)
for the general rule this follows.

## Input

Detect the scope from the argument:

| Argument          | Scope                          |
| ----------------- | ------------------------------ |
| No argument       | **Entire codebase**            |
| File path or glob | **Specific files/directories** |

## Gather file list

- **Entire codebase (no argument)** — collect all source files.
  Exclude vendored, generated, and test fixture directories (e.g.
  `vendor/`, `node_modules/`, `testdata/`, `.git/`).
- **Specific paths** — expand any globs, then validate paths exist.

If no files are found, report "No files to review" and stop.

## Gather project metadata

Before spawning the subagent, run these git commands to build a
diagnostic snapshot. Use it to prioritize which files to examine
first — high-churn, high-bug files are the most valuable targets.

**Churn hotspots** — most-changed files in the last year:

```bash
git log --format=format: --name-only --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
```

**Bug clusters** — files most often touched in bug-fix commits:

```bash
git log -i -E --grep="fix|bug|broken" \
  --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

**Cross-reference**: files in **both** churn hotspots and bug
clusters are the highest-risk code. Flag these explicitly in the
metadata passed to the subagent.

## Spawn one audit subagent (read-only)

Spawn a single subagent (general-purpose / workhorse role). The
prompt must include:

- The full "What to look for" checklist below.
- The list of files in scope.
- The **project metadata** above (churn hotspots, bug clusters,
  cross-referenced high-risk files) — instruct the subagent to
  examine high-risk files first.
- Instructions to work file by file and to **edit nothing** —
  every issue becomes a proposed-fix entry, not a change.

### Subagent instructions

Include this in the subagent prompt:

> You are a principal engineer performing a code quality audit.
> Your job is to find "AI slop" — the telltale signs of
> AI-generated code that was accepted without proper review —
> and propose fixes for each. **This is a read-only audit: do
> not edit any file, run any formatter, or change the workspace
> in any way.** Read and report only.
>
> **Rules:**
>
> - Propose a concrete fix for each issue you find. Do not apply
>   it.
> - Classify every proposed fix as **safe** (no behavior change)
>   or **behavior-changing**.
> - Do not propose changes that violate the language's or
>   codebase's conventions.
> - Be aggressive about identifying slop but conservative about
>   what you label "safe" — when unsure, label it
>   behavior-changing.
> - For any fix that would alter behavior, public APIs, or usage
>   patterns, note which `docs/**/*.md` or `**/README.md` files
>   the apply step would also need to update.
>
> Return your findings as a JSON array of proposed fixes, each:
>
> ```json
> {
>   "file": "path/to/file",
>   "line": "approx line or range",
>   "category": "verbosity | duplication | comments | naming | structure | over-engineering",
>   "class": "safe | behavior-changing",
>   "what": "the current problem",
>   "fix": "the concrete change to make",
>   "docs": "docs/README files the fix also touches, or null"
> }
> ```
>
> Also return a count of files reviewed with no issues. Do not
> include a "changes made" section — you make no changes.

## Apply fixes interactively (main thread)

Take the proposed-fix list and apply it yourself, in the main
thread, so the user can steer each change:

1. **Present the list first**, grouped by `class` (safe vs
   behavior-changing) and then by category. Give the user a quick
   read on scope before anything is touched.
1. **Safe fixes** — apply them, but surface anything you're
   second-guessing rather than waving it through. The user can tell
   you mid-stream to skip, change approach, or stop; honor it
   immediately.
1. **Behavior-changing fixes** — do not apply unprompted. For each,
   show the proposed change and ask the user to approve, modify, or
   skip.
1. **Docs** — when an applied fix changes behavior, public APIs, or
   usage patterns, update the `docs`/`README` files the auditor
   flagged. Do not create new documentation files unless the change
   introduces a wholly new component.
1. Track what was applied and what was skipped for the summary.

### What to look for

Include this checklist verbatim in the subagent prompt:

#### Unnecessary verbosity

- Overly defensive code: nil checks that can't fire, error handling
  for impossible cases, redundant type assertions
- Wrapper functions that add no value — just forwarding calls with
  no additional logic
- Variables assigned once and immediately returned; inline them
- Unnecessary else branches after a return

#### Duplicated code

- Copy-pasted logic that should be extracted into a shared function
- Near-identical switch/case arms that could be collapsed
- Repeated string literals that should be constants

#### Comment problems

- Comments that restate what the code does ("increment i by 1")
- Temporal comments ("added this to fix the bug", "this was needed
  because...")
- Uncertain thinking leaked into comments ("actually", "but wait",
  "I think", "probably")
- Commented-out code that should be deleted

#### Naming issues

- Variables named `result`, `data`, `temp`, `val`, `ret` when a
  descriptive name exists
- Boolean variables/functions not named as predicates (should read
  as a question)
- Inconsistent naming conventions within the same file

#### Structural issues

- Functions that are too long (>50 lines) and do multiple things
- Deep nesting (>3 levels) that could be flattened with early
  returns
- Dead code: unused functions, unreachable branches, vestigial
  parameters
- Temporary files, debug prints, or scaffolding left behind
- Imports that are no longer needed

#### Over-engineering

- Abstractions with only one implementation
- Interface types with a single concrete user
- Configuration for things that never vary
- Builder/factory patterns where a simple constructor suffices

## Compile summary

After the interactive apply step, create the output directory with
`mkdir -p docs/plans`, then write the report to
`docs/plans/<YYYY-MM-DD-HHMM>-cleanup.md`:

```markdown
## Cleanup Report

- **Date:** YYYY-MM-DD HH:MM
- **Scope:** entire codebase | specific paths
- **Files reviewed:** <count>
- **Files changed:** <count>
- **Fixes applied:** <count>
- **Fixes skipped:** <count>

### Changes Applied

[Group by category — verbosity, duplication, comments, naming,
structure, over-engineering. Each item: file, line, what
changed.]

### Skipped / Deferred

[Proposed fixes the user declined or deferred. Each item: file,
line, description, why it matters, the proposed fix.]
```

Print a short summary and the file path in the conversation.

## Agent teams (if your harness supports it)

Run the **audit** subagent as a background teammate so the main
thread stays responsive while it scans. It is read-only — it
returns the proposed-fix list, it never edits. Keep the interactive
apply step in the main thread regardless, so every edit stays
steerable.

See [`shared/AGENT-TEAMS.md`](../shared/AGENT-TEAMS.md) for
enablement instructions.
