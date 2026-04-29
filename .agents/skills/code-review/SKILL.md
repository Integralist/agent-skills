---
name: code-review
description: >-
  Code review using specialized subagents. Analyzes consistency,
  idiomatic Go, data correctness, and security. Works on PRs
  or local code. Pass --plan or --plan=<path> to additionally
  check the diff against an implementation plan.
---

# Code Review Skill

Review code using up to four specialized subagents working in parallel (five
with `--plan`). Each subagent focuses on a different review dimension. Works
against GitHub PRs or local code changes.

**Note:** Some platforms limit concurrent subagents (e.g., Swival caps at 4).
The four dimensions below are chosen to fit that constraint. When `--plan` is
active, the Plan Adherence subagent is a fifth — run it sequentially after the
first four report back if the platform cap prevents parallel spawn. If your
platform supports more, consider splitting "Consistency" into separate naming
and architecture reviews.

## Input

The argument follows the skill invocation. Detect the mode:

| Argument                      | Mode                                  |
| ----------------------------- | ------------------------------------- |
| PR URL or `owner/repo#number` | **PR mode**                           |
| `--diff` or no argument       | **Local: branch diff** vs main/master |
| `--uncommitted`               | **Local: uncommitted changes**        |
| File path or glob pattern     | **Local: explicit paths**             |

`--plan` (or `--plan=<path>`) is an orthogonal modifier that can be combined
with any of the modes above. When present, an additional Plan Adherence subagent
is spawned. See "Plan mode" below.

## PR Mode: Fetch Context

Use the GitHub CLI (`gh`) or equivalent to fetch PR metadata and the full diff:

1. `gh pr view <number> --repo <owner>/<repo> --json title,body,baseRefName,headRefName,additions,deletions`
1. `gh pr diff <number> --repo <owner>/<repo> --name-only`
1. `gh pr diff <number> --repo <owner>/<repo>`

## Local Mode: Gather Context

### Detect the default branch

Run these in order until one succeeds:

1. `git rev-parse --verify main` — use `main`
1. `git rev-parse --verify master` — use `master`
1. `git symbolic-ref refs/remotes/origin/HEAD` — parse the branch name from the
   output

Store the result as `DEFAULT_BRANCH`.

### Branch diff (default / `--diff`)

```bash
BASE=$(git merge-base HEAD "$DEFAULT_BRANCH")
git diff "$BASE"...HEAD
git diff --name-only "$BASE"...HEAD
```

### Uncommitted (`--uncommitted`)

```bash
git diff HEAD
git diff --name-only HEAD
git status --porcelain | sed -n 's/^?? //p'
```

For any untracked files listed above, read each one and include its contents as
additional context alongside the diff.

### Explicit paths

For each provided path or glob pattern: expand globs, read file contents, and if
tracked, get the diff: `git diff HEAD -- <paths>`

### No changes

If the diff is empty and no files are found, report "No changes to review" and
stop.

### Large diffs

If the diff exceeds ~3000 lines, pass only the file list to subagents and
instruct them to read files individually rather than embedding the entire diff
in the prompt.

## Plan mode (`--plan[=<path>]`)

When `--plan` is present, spawn an additional Plan Adherence subagent alongside
the four standard subagents. Do nothing extra when the flag is absent.

### Locate the plan

Resolve the plan path in this order:

1. **Explicit** — `--plan=<path>` gives the plan path directly.
1. **PR body link** (PR mode only) — scan the PR body for a link to a file under
   `docs/plans/`. If found, use it.
1. **Newest plan** — pick the newest `docs/plans/*.md` by mtime, excluding
   `README.md` and anything under `docs/plans/completed/`.

If no plan is found, do not spawn the Plan Adherence subagent and note "no plan
located, skipping plan adherence" in the summary.

### Plan Adherence focus

- **Unplanned files** — files in the diff not listed in the plan's File Changes
  table or referenced by a task
- **Missing implementation** — tasks marked or implied as done in the plan, but
  not reflected in the diff
- **Scope excess** — changes that exceed the plan's stated goal (refactors of
  adjacent code, rename sprees, unrelated fixes). Treat these as informational;
  the user may commit them separately by design.
- **Plan drift** — changes that contradict the plan's stated approach (different
  file structure, different API shape)

The subagent must **report**, not judge. Do not rate scope excess as a problem —
let the user decide.

## Spawn Subagents

Spawn one subagent per review dimension. The roles below are descriptions, not
agent names — use your platform's actual agent/subagent primitives.

Each subagent prompt must include:

- The review dimension and focus area
- The list of changed files
- The diff (or instruction to read files if diff is too large)
- **Do NOT add comments to any PR. Report findings back when complete.**

### Review Dimensions

1. **Consistency Review** (general-purpose role) — naming patterns, code style
   consistency, error handling patterns, metric/label/logging consistency,
   structural consistency with existing codebase

1. **Data Correctness Review** (general-purpose role) — correctness of
   computations and state, race conditions in concurrent access, correct
   context/value propagation, resource lifecycle (leaks, double-close), error
   path completeness

1. **Security Review** (general-purpose role) — injection/cardinality attacks on
   labels or inputs, information leakage, unbounded reads or allocations,
   resource exhaustion, dependency security, timing side channels,
   authentication/authorization gaps

1. **Idiomatic Go Review** (general-purpose role) — idiomatic Go as detailed in
   https://go.dev/doc/effective_go. This subagent MUST read
   https://go.dev/doc/effective_go before beginning the review.

1. **Plan Adherence Review** *(only when `--plan` is active and a plan was
   located)* — see "Plan mode" above. The subagent prompt must additionally
   include the plan file contents.

Collect all results before compiling the summary.

## Compile Summary

### PR mode output

Present a consolidated review in the conversation:

```markdown
## PR #<number> Review Summary: "<title>"

**Overall assessment:** [1-2 sentence summary of PR quality]

### Actionable Items

Items worth discussing or changing, ordered by severity
(High/Medium/Low). Each item should include:
- The file and approximate line reference
- A code snippet if relevant
- Why it matters
- Suggestion for improvement

### Informational / No Action Needed

Brief bullet points for things that are fine or only worth
noting for awareness.
```

### Local mode output

Use the same format as PR mode output above, with these additional metadata
fields at the top:

```markdown
## Code Review: <branch-name or "uncommitted" or path>

**Date:** YYYY-MM-DD HH:MM
**Mode:** branch-diff | uncommitted | paths
**Branch:** <branch-name>
**Base:** <merge-base-ref> (if applicable)
**Files reviewed:** <count>
```

After presenting the review, ask the user what they want to do next:

```txt
What would you like to do with this review?

1. Save to docs/plans/code-review-<date>.md
2. Address the actionable items now
3. Nothing — just wanted the review
4. Something else?
```

Deduplicate findings across subagents — if multiple subagents flag the same
issue, combine them into a single item citing all relevant perspectives.

When `--plan` was active and findings were received, present the Plan Adherence
findings as a distinct subsection under "Informational / No Action Needed" (or
escalate to "Actionable" only if the user clearly wants scope discipline
enforced on this PR — default is informational):

```markdown
### Plan Adherence

**Plan:** `docs/plans/<slug>.md`

- **Unplanned files**: ...
- **Missing implementation**: ...
- **Scope excess**: ...
- **Plan drift**: ...
```

If no plan was located, state "Plan adherence: no plan located, skipped." once
in the summary.

## Notes

- The review is language-aware but optimized for Go codebases.
- For non-Go PRs, the idiomatic Go subagent should be replaced with
  language-appropriate idiom checking, or omitted.
- All subagents should read full file context (not just the diff) when needed to
  understand surrounding code patterns.
- The skill does not post any comments to the PR — all output stays in the
  conversation or in the local review file.

## References

- https://go.dev/doc/effective_go — Full Effective Go document used by the
  Idiomatic Go Review subagent
