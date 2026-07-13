---
name: code-review
description: >-
  Code review using specialized subagents. Analyzes consistency,
  idiomatic Go, data correctness, and security. Works on PRs
  or local code. Pass --plan or --plan=<path> to additionally
  check the diff against an implementation plan.
argument-hint: '[PR_URL | --diff | --uncommitted | path] [--plan[=<path>]]'
---

# Code Review Skill

Review code with up to four specialized subagents in parallel (five with
`--plan`), each focused on a different dimension. Works against GitHub PRs or
local changes.

> [!NOTE]
> Some platforms cap concurrent subagents; the four dimensions fit a common
> limit of 4. With `--plan`, run the Plan Adherence subagent
> as a fifth — sequentially after the first four if the cap prevents a parallel
> spawn. If your platform allows more, split "Consistency" into separate naming
> and architecture reviews.

## Input

Detect the mode from the argument:

| Argument                      | Mode                              |
| ----------------------------- | --------------------------------- |
| PR URL or `owner/repo#number` | PR mode                           |
| `--diff` or no argument       | Local: branch diff vs main/master |
| `--uncommitted`               | Local: uncommitted changes        |
| File path or glob pattern     | Local: explicit paths             |

`--plan` (or `--plan=<path>`) is an orthogonal modifier combinable with any
mode. When present, spawn the Plan Adherence subagent. See "Plan mode".

## Gather the diff once

Gather the full diff **once** and write it to a single temp file (e.g.
`${TMPDIR:-/tmp}/code-review.diff`). Subagents read the diff from that path — do
not embed it in prompts, and do not have any subagent re-fetch or re-compute it.
This avoids re-tokenizing the diff per subagent.

Record for the subagent prompts:

- `DIFF_PATH` — absolute path to the diff file just written
- `FILE_LIST` — changed files, one per line
- `HAS_GO` — true if any changed file ends in `.go`
- `LARGE_DIFF` — true if the diff exceeds ~3000 lines (see "Large diffs")

## PR Mode: Fetch Context

Use the GitHub CLI (`gh`) or equivalent for PR metadata and the full diff:

1. `gh pr view <number> --repo <owner>/<repo> --json title,body,baseRefName,headRefName,additions,deletions`
1. `gh pr diff <number> --repo <owner>/<repo> --name-only`
1. `gh pr diff <number> --repo <owner>/<repo> > "$DIFF_PATH"`

## Local Mode: Gather Context

### Detect the default branch

Run these in order until one succeeds; store the result as `DEFAULT_BRANCH`:

1. `git rev-parse --verify main` — use `main`
1. `git rev-parse --verify master` — use `master`
1. `git symbolic-ref refs/remotes/origin/HEAD` — parse the branch name from the
   output

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

For any untracked files listed, read each and include its contents as additional
context alongside the diff.

### Explicit paths

For each path or glob: expand globs, read file contents, and if tracked, write
the diff to the temp file: `git diff HEAD -- <paths> > "$DIFF_PATH"`

### No changes

If the diff is empty and no files are found, report "No changes to review" and
stop.

### Large diffs

The flow passes a file path, not an embedded diff, so subagents read the file
themselves. If the diff exceeds ~3000 lines, write the **file list** (not the
diff) to `DIFF_PATH`, set `LARGE_DIFF` true, and instruct subagents to read each
changed file individually rather than the diff file.

## Plan mode (`--plan[=<path>]`)

When `--plan` is present, spawn an additional Plan Adherence subagent alongside
the four standard ones. Do nothing extra when the flag is absent.

### Locate the plan

Resolve the plan path in this order:

1. **Explicit** — `--plan=<path>` gives it directly.
1. **PR body link** (PR mode only) — scan the PR body for a link to a file under
   `docs/plans/`. If found, use it.
1. **Newest plan** — newest `docs/plans/*.md` by mtime, excluding `README.md`
   and anything under `docs/plans/completed/`.

If no plan is found, do not spawn the subagent; note "no plan located, skipping
plan adherence" in the summary.

### Plan Adherence focus

- **Unplanned files** — files in the diff not in the plan's File Changes table
  or referenced by a task
- **Missing implementation** — tasks marked or implied done in the plan but not
  reflected in the diff
- **Scope excess** — changes exceeding the plan's stated goal (refactors of
  adjacent code, rename sprees, unrelated fixes). Informational; the user may
  commit them separately by design.
- **Plan drift** — changes that contradict the plan's stated approach (different
  file structure, different API shape)

The subagent must **report**, not judge. Do not rate scope excess as a problem —
let the user decide.

## Spawn Subagents

Spawn one subagent per dimension (roles below are descriptions, not agent names
— use your platform's primitives). Run each on the cheapest model tier adequate
to its dimension (see
[`../shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md)). Each
prompt must include:

- The review dimension and focus area
- `DIFF_PATH` (with the instruction to read the diff from it) and `FILE_LIST`
- For `LARGE_DIFF`: read each changed file individually
- **Review-only; do not modify code or run tools that change state. Do NOT add
  comments to any PR. Return findings as structured JSON (schema below) when
  complete.**

### Findings schema

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
verify and dedupe deterministic.

### Review Dimensions

1. **Consistency Review** (general-purpose role) — naming patterns, code style,
   error handling patterns, metric/label/logging consistency, structural
   consistency with the existing codebase. *(When `HAS_GO`)* the subagent MUST
   first load the `go-conventions` skill
   (`.agents/skills/go-conventions/SKILL.md`) and judge Go naming, error
   handling, and structure against its rules rather than generic conventions.

1. **Data Correctness Review** (general-purpose role) — correctness of
   computations and state, race conditions in concurrent access, correct
   context/value propagation, resource lifecycle (leaks, double-close), error
   path completeness.

1. **Security Review** (general-purpose role) — injection/cardinality attacks on
   labels or inputs, information leakage, unbounded reads or allocations,
   resource exhaustion, dependency security, timing side channels,
   authentication/authorization gaps. **Use the most capable model available** —
   security findings are highest-stakes and least tolerant of a weaker model's
   misses.

1. **Idiomatic Go Review** (general-purpose role) *(only when `HAS_GO`)* —
   idiomatic Go per https://go.dev/doc/effective_go **and** the project's
   `go-conventions` skill. Before starting, the subagent MUST both (a) read
   https://go.dev/doc/effective_go and (b) load the `go-conventions` skill
   (`.agents/skills/go-conventions/SKILL.md`), then flag changed Go that
   violates its rules. Skip this dimension entirely when `HAS_GO` is false (see
   Notes).

1. **Plan Adherence Review** *(only when `--plan` is active and a plan was
   located)* — see "Plan mode". The prompt must additionally include the plan
   file contents.

Collect all results before compiling the summary.

## Verify Findings

Before compiling, run an adversarial verification pass to drop false positives.
For each finding, spawn a verifier subagent (or batch findings per verifier if
your platform caps concurrency — this stage runs *after* the dimension
reviewers, so it does not compete for the cap). Instruct each verifier to **try
to refute** the finding, not confirm it:

- Read the cited `file`/`line` and enough surrounding context from `DIFF_PATH`
  and the working tree (or `gh`/MCP file reads in PR mode).
- Look for reasons it is wrong or moot: code not actually changed by the diff; a
  guard/caller/invariant already prevents it; the behavior is intended; the
  claim misreads language/library semantics; the line reference doesn't match
  real code.
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

Deduplicate confirmed findings — if multiple subagents flag the same file/line,
combine into one item citing all relevant perspectives. Sort by severity (High →
Medium → Low). Optionally note how many findings verification dropped.

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

Same format as PR mode, with these metadata fields at the top:

```markdown
## Code Review: <branch-name or "uncommitted" or path>

**Date:** YYYY-MM-DD HH:MM
**Mode:** branch-diff | uncommitted | paths
**Branch:** <branch-name>
**Base:** <merge-base-ref> (if applicable)
**Files reviewed:** <count>
```

After presenting the review, ask the user what to do next:

```txt
What would you like to do with this review?

1. Save to docs/plans/<yyyy-mm-dd>-code-review.md
2. Address the actionable items now
3. Nothing — just wanted the review
4. Something else?
```

### Plan adherence

When `--plan` was active and findings were received, present them as a distinct
subsection under "Informational / No Action Needed" (escalate to "Actionable"
only if the user clearly wants scope discipline enforced; default is
informational):

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
- For non-Go PRs, replace the idiomatic Go subagent with language-appropriate
  idiom checking, or omit it.
- Subagents should read full file context (not just the diff) when needed to
  understand surrounding patterns.
- The skill posts no comments to the PR — all output stays in the conversation
  or in the local review file.

## Agent teams (if your harness supports it)

Run the review subagents as parallel teammates: spawn one per review dimension,
have each report findings to the team lead, then synthesize. Faster than
sequential subagent calls when the harness can run them concurrently.

See [`shared/AGENT-TEAMS.md`](../shared/AGENT-TEAMS.md) for enablement
instructions.

## References

- https://go.dev/doc/effective_go — Full Effective Go document used by the
  Idiomatic Go Review subagent
- `.agents/skills/go-conventions/SKILL.md` — the project's mandatory Go
  convention skill; the Idiomatic Go Review subagent loads and enforces it
