---
name: code-review
description: >-
  Code review using specialized subagents. Analyzes behavior and tests,
  security, reliability, and maintainability. Use when reviewing a remote PR or
  local code, including unpushed/uncommitted changes. Pass --plan or
  --plan=<path> to check the diff against an implementation plan.
argument-hint: '[PR_URL | --diff | --uncommitted | --all-local | path] [--plan[=<path>]]'
---

# Code Review Skill

Review code with four specialized subagents in parallel (five with `--plan`),
each focused on a different dimension. Works against GitHub PRs or local
changes, including committed-but-unpushed and uncommitted work.

> [!NOTE]
> Some platforms cap concurrent subagents; the four dimensions fit a common
> limit of 4. With `--plan`, run the Plan Adherence subagent
> as a fifth — sequentially after the first four if the cap prevents a parallel
> spawn.

## Input

Follow the loading instructions in [`MODES.md`](MODES.md) for the selected
source and optional Plan Modifier. Complete source gathering before spawning
reviewers.

## Gather the diff once

Gather the full diff **once** and write it to a single temp file (e.g.
`${TMPDIR:-/tmp}/code-review.diff`). Subagents read the diff from that path — do
not embed it in prompts, and do not have any subagent re-fetch or re-compute it.
This avoids re-tokenizing the diff per subagent.

Create a second temp file, `CONTEXT_PATH`, containing:

- The stated purpose of the change
- PR title and body, when available
- Relevant repository instructions
- The plan or specification, when provided
- Available test results

Record for the subagent prompts:

- `DIFF_PATH` — absolute path to the diff file just written
- `CONTEXT_PATH` — absolute path to the review-context file
- `FILE_LIST` — changed files, one per line
- `HAS_GO` — true if any changed file ends in `.go`
- `LARGE_DIFF` — true if the diff exceeds ~3000 lines (see "Large diffs")

Reviewers must judge changes against `CONTEXT_PATH`. When intent remains
unclear, they report an unknown rather than infer a defect.

## Spawn Subagents

Spawn one subagent per dimension (roles below are descriptions, not agent names
— use your platform's primitives). Run each on the cheapest model tier adequate
to its dimension (see
[`../shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md)). Each
prompt must include:

- The review dimension and focus area
- `DIFF_PATH`, `CONTEXT_PATH`, and `FILE_LIST`, with instructions to read both
  files
- For `LARGE_DIFF`: inspect per-file shards or changed files incrementally
- **Stay within the assigned dimension. Mention another dimension only when
  needed to explain impact; do not independently review it.**
- **Review-only; do not modify code or run tools that change state. Do NOT add
  comments to any PR. Return findings as structured JSON (schema below) when
  complete.**

### Findings schema

```json
{
  "files_reviewed": ["path/to/file"],
  "files_skipped": [
    {
      "file": "path/to/file",
      "reason": "why this dimension does not apply"
    }
  ],
  "findings": [
    {
      "severity": "High | Medium | Low",
      "file": "path/to/file",
      "line": "approx line or range",
      "snippet": "short relevant code excerpt",
      "why": "why it matters",
      "suggestion": "concrete improvement"
    }
  ],
  "unknowns": [
    {
      "question": "fact or intended behavior that could not be established",
      "why": "why resolving it matters to this review dimension"
    }
  ]
}
```

Every reviewer must place every `FILE_LIST` entry in either `files_reviewed` or
`files_skipped`. Return empty finding and unknown arrays when nothing is worth
raising. Unknowns are not findings: do not present an unanswered question as a
defect unless the code demonstrates one.

### Severity

- **High** — likely security compromise, data loss, outage, or violation of a
  core contract
- **Medium** — demonstrated defect under plausible conditions
- **Low** — concrete maintainability or testability cost, not a style preference

Severity reflects impact and likelihood, not reviewer confidence.

### Review Dimensions

1. **Behavior and Tests Review** — intended behavior, regressions, edge cases,
   error paths, compatibility, and whether tests prove the changed behavior and
   important failure modes.

1. **Security and Abuse Resistance Review** — trust boundaries,
   authentication/authorization, injection, information leakage, unsafe
   dependencies, unbounded work, resource exhaustion, and fail-open behavior.
   **Use the most capable model available** because security findings are
   highest-stakes and least tolerant of misses.

1. **Reliability and Data Correctness Review** — computations, state
   transitions, concurrency, context propagation, retries, partial failures,
   resource lifecycle, leaks, double-close, and error-path completeness.

1. **Maintainability and Conventions Review** — project consistency,
   readability, API design, observability, naming, error handling, and
   language idioms. When `HAS_GO`, the subagent MUST first load the
   `go-conventions` skill (`.agents/skills/go-conventions/SKILL.md`) and judge
   changed Go against project rules rather than generic conventions. For other
   languages, use the repository's corresponding instructions when available.

1. **Plan Adherence Review** *(only when `--plan` is active and a plan was
   located)* — see "Plan Modifier" in `MODES.md`. The prompt must additionally
   include the plan file contents.

Collect all results before verification. Do not advance until every reviewer
has accounted for every file and every changed file was reviewed by at least
one applicable dimension. Re-run or redirect reviewers to close any gap.

Every suggestion must give the smallest viable correction. Include an
alternative only when it exposes a meaningful trade-off. Do not propose
unrelated redesigns.

## Verify Findings

Before compiling, run an adversarial verification pass to drop false positives.
For each finding, spawn a verifier subagent (or batch findings per verifier if
your platform caps concurrency — this stage runs *after* the dimension
reviewers, so it does not compete for the cap). Instruct each verifier to **try
to refute** the finding, not confirm it:

- Read the cited `file`/`line` and enough surrounding context from `DIFF_PATH`
  and the selected source described in `MODES.md`.
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
dropped count in the summary. Keep unknowns separate and deduplicate them; do
not send them through defect verification unless they assert a defect.

## Compile Summary

Deduplicate confirmed findings — if multiple subagents flag the same file/line,
combine them into one item citing all relevant dimensions. Sort by severity
(High → Medium → Low). Optionally note how many findings verification dropped.
List unresolved unknowns after findings and identify what evidence would answer
each one. Load "Remote PR" or "Local" from [`OUTPUT.md`](OUTPUT.md), plus "Plan
Adherence" when applicable, and render the consolidated review. Completion
requires every changed file accounted for, every retained finding verified, and
every unknown separated from defects.

## Agent teams (if your harness supports it)

Run the review subagents as parallel teammates: spawn one per review dimension,
have each report findings to the team lead, then synthesize. Faster than
sequential subagent calls when the harness can run them concurrently.

See [`shared/AGENT-TEAMS.md`](../shared/AGENT-TEAMS.md) for enablement
instructions.
