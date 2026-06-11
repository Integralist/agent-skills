---
name: code-review
description: >-
  Code review using specialized subagents. Analyzes consistency,
  idiomatic Go, data correctness, and security. Works on PRs
  or local code. Pass --plan or --plan=<path> to additionally
  check the diff against an implementation plan.
user-invocable: true
argument-hint: '[PR_URL | --diff | --uncommitted | path] [--plan[=<path>]]'
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

## Gather the diff once

Gather the full diff **once** and write it to a single temp file (e.g.
`${TMPDIR:-/tmp}/code-review.diff`). Subagents read the diff from that path — do
not embed the full diff in each subagent prompt, and do not have any subagent
re-fetch or re-compute it. This keeps the diff from being re-tokenized once per
subagent.

Record these for the subagent prompts:

- `DIFF_PATH` — absolute path to the diff file just written
- `FILE_LIST` — the changed files (one per line)
- `HAS_GO` — true if any changed file ends in `.go`
- `LARGE_DIFF` — true if the diff exceeds ~3000 lines (see "Large diffs" below)

## PR Mode: Fetch Context

Use the GitHub CLI (`gh`) or equivalent to fetch PR metadata and the full diff:

1. `gh pr view <number> --repo <owner>/<repo> --json title,body,baseRefName,headRefName,additions,deletions`
1. `gh pr diff <number> --repo <owner>/<repo> --name-only`
1. `gh pr diff <number> --repo <owner>/<repo> > "$DIFF_PATH"`

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
git diff "$BASE"...HEAD > "$DIFF_PATH"
git diff --name-only "$BASE"...HEAD
```

### Uncommitted (`--uncommitted`)

```bash
git diff HEAD > "$DIFF_PATH"
git diff --name-only HEAD
git status --porcelain | sed -n 's/^?? //p'
```

For any untracked files listed above, read each one and include its contents as
additional context alongside the diff.

### Explicit paths

For each provided path or glob pattern: expand globs, read file contents, and if
tracked, write the diff to the temp file: `git diff HEAD -- <paths> > "$DIFF_PATH"`

### No changes

If the diff is empty and no files are found, report "No changes to review" and
stop.

### Large diffs

The default flow already passes a file path, not an embedded diff, so subagents
read the diff file themselves. If the diff exceeds ~3000 lines, write the **file
list** (not the diff) to `DIFF_PATH`, set `LARGE_DIFF` true, and instruct
subagents to read each changed file individually rather than the diff file.

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
- `DIFF_PATH` (with the instruction to read the diff from it) and `FILE_LIST`
- For `LARGE_DIFF`: the instruction to read each changed file individually
- **Do NOT add comments to any PR. Return findings as structured JSON (schema
  below) when complete.**

### Findings schema

Each subagent returns:

```json
{
  "findings": [
    {
      "severity": "High | Medium | Low",
      "file": "path/to/file",
      "line": "approx line or range",
      "snippet": "short relevant code excerpt",
      "why": "why it matters",
      "suggestion": "concrete improvement"
    }
  ]
}
```

Return `{"findings": []}` when nothing is worth raising. Structured output makes
the verify and dedupe steps deterministic.

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
   authentication/authorization gaps. **Use the most capable model available**
   for this dimension — security findings are the highest-stakes and least
   tolerant of a weaker model's misses.

1. **Idiomatic Go Review** (general-purpose role) — idiomatic Go as detailed in
   https://go.dev/doc/effective_go. This subagent MUST read
   https://go.dev/doc/effective_go before beginning the review.

1. **Plan Adherence Review** *(only when `--plan` is active and a plan was
   located)* — see "Plan mode" above. The subagent prompt must additionally
   include the plan file contents.

Collect all results before compiling the summary.

## Verify Findings

Before compiling, run an adversarial verification pass to drop false positives.
For each finding returned by the dimension subagents, spawn a verifier subagent
(or batch findings per verifier if your platform caps concurrency — this stage
runs *after* the dimension reviewers, so it does not compete with them for the
cap). Instruct each verifier to **try to refute** the finding, not confirm it:

- Read the cited `file`/`line` and enough surrounding context from `DIFF_PATH`
  and the working tree (or `gh`/MCP file reads in PR mode).
- Look for reasons the finding is wrong or moot: code not actually changed by
  the diff; a guard/caller/invariant already prevents it; the behavior is
  intended; the claim misreads language/library semantics; the line reference
  doesn't match real code.
- **Default to refuted** when the finding cannot be positively confirmed from
  the code. The bar is "demonstrably real," not "plausible."

Each verifier returns:

```json
{
  "isReal": true,
  "confidence": "high | medium | low",
  "reason": "what confirms or refutes it",
  "correctedSeverity": "High | Medium | Low (omit if unchanged)"
}
```

Keep only findings with `isReal: true`; apply any `correctedSeverity`. Note the
dropped count in the summary.

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

Deduplicate the confirmed findings — if multiple subagents flag the same
file/line issue, combine them into a single item citing all relevant
perspectives. Sort by severity (High → Medium → Low). Optionally note how many
findings were dropped by verification.

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

## Agent teams (if your harness supports it)

If your harness supports named, parallel agent teams (e.g. Claude
Code's experimental [agent teams](https://code.claude.com/docs/en/agent-teams)),
run the review subagents as parallel teammates: spawn one per
review dimension, have each report findings back to the team lead,
then synthesize. This is faster than sequential subagent calls when
the harness can run them concurrently.

On Claude Code, enable agent teams by adding the following to
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## References

- https://go.dev/doc/effective_go — Full Effective Go document used by the
  Idiomatic Go Review subagent
