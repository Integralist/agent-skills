---
name: code-review
description: >-
  Code review using specialized subagents. Analyzes behavior and tests,
  security, reliability and performance, and maintainability. Use when
  reviewing a remote PR or local code, including unpushed/uncommitted changes.
  Pass --plan or --plan=<path> to check the diff against an implementation plan
  or task list.
argument-hint: '[PR_URL | --diff | --uncommitted | --all-local | path] [--plan[=<path>]]'
---

# Code Review Skill

Review code with four specialized subagents in parallel, plus a fifth for spec
and plan adherence when it applies. Works against GitHub PRs or local changes,
including committed-but-unpushed and uncommitted work.

> [!NOTE]
> Some platforms cap concurrent subagents; the four dimensions fit a common
> limit of 4. Run the Spec and Plan Adherence subagent as a fifth —
> sequentially after the first four if the cap prevents a parallel spawn.

## Input

Follow the loading instructions in [`MODES.md`](MODES.md) for the selected
source and for Spec and Plan Adherence. Complete source gathering before
spawning reviewers.

## Gather the diff once

Gather the full diff **once** and write it to a single temp file (e.g.
`${TMPDIR:-/tmp}/code-review.diff`). Subagents read the diff from that path — do
not embed it in prompts, and do not have any subagent re-fetch or re-compute it.
This avoids re-tokenizing the diff per subagent.

Create a second temp file, `CONTEXT_PATH`, containing:

- The stated purpose of the change
- PR title and body, when available
- Relevant repository instructions
- Intent documents — project specs, plans, task lists, and living specs —
  resolved by "Spec and Plan Adherence" in `MODES.md`, each labelled with its
  path
- Available test results

Record for the subagent prompts:

- `DIFF_PATH` — absolute path to the diff file just written
- `CONTEXT_PATH` — absolute path to the review-context file
- `FILE_LIST` — changed files, one per line
- `CONVENTIONS` — every conventions skill matching a changed file (table below)
- `LARGE_DIFF` — true if the diff exceeds ~3000 lines (see "Large diffs")

| Changed file                                         | Conventions skill      |
| ---------------------------------------------------- | ---------------------- |
| `*.go`                                               | `conventions-go`       |
| `*.py`                                               | `conventions-python`   |
| `*.sql`                                              | `conventions-sql`      |
| `*.md`                                               | `conventions-markdown` |
| `*.mmd`, `*.mermaid`, or a `mermaid` fence in a diff | `conventions-mermaid`  |

Reviewers must judge changes against `CONTEXT_PATH`. When intent remains
unclear, they report an unknown rather than infer a defect.

**Intent sources can disagree.** The PR body, project spec, living spec,
operational docs, and code each state intended behavior. When two disagree,
report the contradiction and cite both locations — settling it by trusting one
source hides the question the author must answer. A demonstrated contradiction
is a finding whose correction names both resolutions (change the code, or
amend the spec); wording too ambiguous to demonstrate one is an unknown.

## Spawn Subagents

Spawn one subagent per dimension (roles below are descriptions, not agent names
— use your platform's primitives). Run each on the cheapest model tier adequate
to its dimension (see
[`../shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md),
including its completion and retry protocol). Set `max_turns: 40` (or platform
equivalent) so deep reading and cross-file checks
do not hit turn limits prematurely. When your platform distinguishes named agent
files from inline characters, prefer saved agent files if configured, or launch
the subagent inline. Each prompt must include:

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
  "status": "COMPLETE | INCOMPLETE",
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
- **Low** — contained cost with no user-visible impact: a minor defect, or a
  concrete maintainability or testability cost. Not a style preference.

Severity reflects impact and likelihood, not reviewer confidence.

### Review Dimensions

Each dimension owns one question. A defect belongs to the dimension whose
question it answers; the others hand it off. Include the owning question and
hand-offs in each subagent prompt.

1. **Behavior and Tests Review** — *Does the change do what `CONTEXT_PATH`
   says, and do the tests prove it?*
   - Owns: intended behavior, logic and computation errors, edge cases,
     regressions, and the contract callers rely on.
   - Blast radius: for every changed exported symbol, signature, or observable
     behavior, search for its callers and confirm each still holds. A caller
     the change breaks is a finding against the change, even when the caller's
     file is unchanged. The same holds for contracts: when the diff changes a
     spec, doc, or policy statement, check the unchanged code that must now
     satisfy it.
   - Tests: (a) new public functions or error branches lacking unit tests; (b)
     new API endpoints or workflow slices lacking integration tests; (c)
     assertions that cannot detect a contract violation. Before dispatch, load
     [TEST-CONTRACTS.md](../shared/TEST-CONTRACTS.md) and include its contents
     in this reviewer's prompt.
   - Hands off: behavior under failure, concurrency, load, or deployment
     (Reliability); attacker-driven misuse (Security).

2. **Security and Abuse Resistance Review** — *Can an attacker or untrusted
   input make this code do something it should not?*
   - Owns: trust boundaries, authentication and authorization, injection,
     information leakage, unsafe dependencies, fail-open behavior, and work or
     resource use an attacker can inflate.
   - Hands off: cost under ordinary load (Reliability).
   - **Use the most capable model available** — security findings are
     highest-stakes and least tolerant of misses.

3. **Reliability, Performance, and Rollout Review** — *Does it keep working
   under failure, concurrency, load, and deployment?*
   - Failure and state: state transitions, concurrency, context propagation,
     retries, partial failures, atomicity, resource lifecycle, leaks,
     double-close, and whether every error path is handled.
   - Performance: a query or remote call per item in a loop (N+1), work that
     grows faster than its input, allocation in hot paths, missing pagination
     or indexes, and blocking calls on latency-sensitive paths.
   - Rollout: migrations that lock or rewrite large tables or cannot be undone;
     schema, API, config, or message changes that break while old and new
     versions run side by side; changes with no rollback path. When
     `CONVENTIONS` includes `conventions-sql`, load it first.
   - Hands off: error-handling style and wrapping (Maintainability).

4. **Maintainability and Conventions Review** — *What does this cost the next
   person who changes it?*
   - Owns: consistency with project precedent, readability, API ergonomics,
     naming, error-handling style, observability conventions (log keys,
     metrics, spans), language idioms, and comments or docs the change left
     stale.
   - Load every skill in `CONVENTIONS` first and judge changed files against
     project rules rather than generic ones. For file types with no
     conventions skill, use the repository's instructions when available.
   - For consistency findings, load the `precedent` skill and cite at least
     two peer `file:line` locations that establish the pattern the change
     departs from. One peer is a coincidence; a finding with fewer than two
     citations is an invention.
   - Hands off: whether errors are handled at all (Reliability).

5. **Spec and Plan Adherence Review** *(when `--plan` is active or the diff
   touches `projects/` or `docs/specs/`, and an intent document was located)*
   — *Does the change deliver what its specs and plan promise, and do those
   documents agree?* See "Spec and Plan Adherence" in `MODES.md`. The prompt
   must additionally include the intent document contents.

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
reviewers, so it does not compete for the cap). Set `max_turns: 40` (or
`max_turns: 50` when batching findings) so caller and invariant searches across
the codebase do not hit turn limits prematurely. Instruct each verifier to **try
to refute** the finding, not confirm it:

- Read the cited `file`/`line` and enough surrounding context from `DIFF_PATH`
  and the selected source described in `MODES.md`.
- Look for reasons it is wrong or moot: code neither changed by the diff nor
  bound by a contract the diff changes; a guard/caller/invariant already
  prevents it; the behavior is intended; the claim misreads language/library
  semantics; the line reference doesn't match real code.
- "Intended" refutes a finding only when you cite the `CONTEXT_PATH` source
  that states the intent and no other source contradicts it. When sources
  disagree, the contradiction is real: confirm it as one.
- For a consistency finding, open each cited peer and confirm at least two
  show the claimed pattern; refute the finding otherwise.
- When running code settles a finding, leave the working tree untouched: run
  Python as `python3 -B` (or with `PYTHONDONTWRITEBYTECODE=1`), keep scratch
  state in memory or a temp directory, and confirm `git status` is unchanged
  afterwards.
- **Default to refuted** when the finding cannot be positively confirmed from
  the code. The bar is "demonstrably real," not "plausible."
- Exception: a High security finding you can neither confirm nor refute
  returns `isReal: false` with `unresolved: true`. An unproven attack path is
  an open question, not a dismissal.

Each verifier returns the shared completion status along with its verdict:

```json
{
  "status": "COMPLETE | INCOMPLETE",
  "isReal": true,
  "unresolved": false,
  "confidence": "high | medium | low",
  "reason": "what confirms or refutes it",
  "correctedSeverity": "High | Medium | Low (omit if unchanged)"
}
```

Keep only findings with `isReal: true`; apply any `correctedSeverity`. Move
each finding marked `unresolved` to unknowns, stating the evidence that would
settle it. Record each dropped finding with the verifier's reason; the summary
lists them so a reader can catch a wrong refutation. Keep unknowns separate and
deduplicate them; do not send them through defect verification unless they
assert a defect.

## Compile Summary

Deduplicate confirmed findings — if multiple subagents flag the same file/line,
combine them into one item citing all relevant dimensions. Sort by severity
(High → Medium → Low). List dropped findings under "Dropped by Verification".
List unresolved unknowns after findings and identify what evidence would answer
each one. Load "Remote PR" or "Local" from [`OUTPUT.md`](OUTPUT.md), plus "Spec
and Plan Adherence" when that reviewer ran, and render the consolidated review. Completion
requires every changed file accounted for, every retained finding verified, and
every unknown separated from defects.

## Agent teams (if your harness supports it)

Run the review subagents as parallel teammates: spawn one per review dimension,
have each report findings to the team lead, then synthesize. Faster than
sequential subagent calls when the harness can run them concurrently.

See [`shared/AGENT-TEAMS.md`](../shared/AGENT-TEAMS.md) for enablement
instructions.
