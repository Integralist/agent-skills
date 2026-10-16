---
name: code-review
description: >-
  Review a PR or local changes with parallel read-only reviewer subagents,
  verify each finding, and check the change against its project's spec and
  plan. Use when reviewing a remote PR or local code, including unpushed or
  uncommitted changes. Pass --plan=<path> to name the plan or task list.
argument-hint: '[PR_URL | --diff | --uncommitted | --all-local | path] [--plan=<path>]'
metadata:
  model-tier: complex
---

# Code Review

Review a change with four read-only reviewer subagents in parallel, one per
profile, plus a fifth for spec and plan adherence when the change has intent
documents. A verifier subagent then tries to refute each finding, and the main
conversation reports only what survives. Review only: never edit code, change
state, or comment on a PR.

1. **Gather the source.** Pick the source from the argument:

   | Argument                      | Source                          |
   | ----------------------------- | ------------------------------- |
   | PR URL or `owner/repo#number` | Remote PR                       |
   | `--diff` or none              | Local branch vs. default branch |
   | `--uncommitted`               | Working-tree changes            |
   | `--all-local`                 | Local branch plus working tree  |
   | File path or glob             | Explicit paths                  |

   Run that source's commands from [MODES.md](MODES.md), writing the whole
   diff once to a temp file, `DIFF_PATH`; reviewers read it from there rather
   than re-fetching it. Never mix remote and local revisions silently. If the
   diff is empty and no files match, report "No changes to review" and stop
   before starting any reviewer. Done when `DIFF_PATH` and the changed-file
   list exist.

2. **Find the intent.** Collect every intent document, in this order:

   1. the `--plan=<path>` file;
   2. project files in the diff, including under `projects/completed/`: a
      project the diff adds or moves is this change's contract, not history;
   3. the plan named by an `Execution-Plan:` trailer in the reviewed commits;
   4. a `projects/` link in the PR body.

   For each plan or task list found, also load its project's `spec.md`, and
   the plan a task list came from. Then add each living spec a found project
   spec names under Living Specifications, every `docs/specs/` file the diff
   changes, and any `docs/specs/` file whose contract covers the changed
   behaviour; when it's unclear whether one applies, record an unknown. A
   completed project outside the diff is history, and its living spec
   supersedes it. Read every document at the reviewed revision.

   Write a second temp file, `CONTEXT_PATH`, with the change's stated purpose,
   PR title and body, the repository's instructions, each intent document
   labelled with its path, and any test results. Done when `CONTEXT_PATH` is
   written.

3. **Review in parallel.** Start one read-only subagent per profile below, on
   the most capable model available: a missed defect costs more than the
   tokens. [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md)
   covers turn budgets and retries. If the platform caps concurrency, run the
   adherence reviewer after the four. Give each one:

   - its profile's question, what it owns, and what it hands off;
   - `DIFF_PATH`, `CONTEXT_PATH`, and the changed-file list, and for a diff
     over about 3000 lines, an instruction to read it file by file;
   - the conventions skills matching the changed files: `conventions-go` for
     `*.go`, `conventions-python` for `*.py`, `conventions-sql` for `*.sql`,
     `conventions-markdown` for `*.md`, and `conventions-mermaid` for Mermaid
     files or fences;
   - the rule to judge the change against `CONTEXT_PATH`, and to report an
     unknown, not a defect, when intent is unclear;
   - the findings schema below, and the rule that every changed file is either
     reviewed or skipped with a reason.

   Done when every reviewer is `COMPLETE` and every changed file was reviewed
   by at least one profile that applies; re-run or redirect reviewers to close
   a gap.

4. **Verify.** Give each finding (or a batch, under a concurrency cap) to a
   verifier subagent on the same model, told to refute it:

   - Read the cited lines and their context at the reviewed revision.
   - Refute it when the code is neither changed nor bound by a contract the
     diff changes, a guard or caller already prevents it, the line doesn't
     match, or it misreads the language or library.
   - "Intended" refutes it only when a `CONTEXT_PATH` source states that
     intent and no other source contradicts it.
   - For a consistency finding, open each cited peer and refute it unless at
     least two show the pattern.
   - Leave the working tree untouched: run Python as `python3 -B`, keep scratch
     files in a temp directory, and check `git status` is unchanged after.
   - Default to refuted unless the finding is demonstrably real. A High
     security finding it can neither confirm nor refute is unresolved: move it
     to the open questions with the evidence that would settle it.

   Each verifier returns:

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

   Done when every finding has a verdict.

5. **Report** with the template below. Keep findings with `isReal: true`,
   applying any corrected severity; merge duplicates across profiles; sort
   High, Medium, then Low; list each dropped finding with the verifier's
   reason. When actionable findings exist, offer to address them. Done when
   every changed file is accounted for, every kept finding is verified, and
   every unknown is kept apart from the defects.

**Findings schema.** Every reviewer returns:

```json
{
  "status": "COMPLETE | INCOMPLETE",
  "files_reviewed": ["path/to/file"],
  "files_skipped": [{ "file": "path/to/file", "reason": "why this profile doesn't apply" }],
  "findings": [
    {
      "severity": "High | Medium | Low",
      "file": "path/to/file",
      "line": "approximate line or range",
      "snippet": "short relevant excerpt",
      "why": "why it matters",
      "suggestion": "smallest viable correction"
    }
  ],
  "unknowns": [{ "question": "what couldn't be established", "why": "why it matters here" }]
}
```

**Severity** reflects impact and likelihood, not the reviewer's confidence.
High means a likely security compromise, data loss, outage, or broken core
contract. Medium means a demonstrated defect under plausible conditions. Low
means a contained cost with no user-visible impact: a minor defect, or a real
maintainability or testability cost, never a style preference. Each
suggestion is the smallest viable correction; add an alternative only when it
exposes a real trade-off.

**When sources disagree.** The PR body, project spec, living spec, docs, and
code each state intent. When two disagree, report the contradiction citing
both; trusting one hides the question the author must answer. A demonstrated
contradiction is a finding whose correction names both fixes (change the code,
or amend the spec); wording too vague to demonstrate one is an unknown.

## Profiles

Each profile owns one question, and a defect belongs to the profile whose
question it answers. A reviewer stays in its profile, mentioning another only
to explain impact.

1. **Behaviour and tests:** *does the change do what `CONTEXT_PATH` says, and
   do the tests prove it?* Owns intended behaviour, logic errors, edge cases,
   regressions, and the contracts callers rely on. For every changed exported
   symbol, signature, or behaviour, find its callers and confirm each still
   holds: a caller the change breaks is a finding, even in an unchanged file.
   The same goes for an unchanged file bound by a spec, doc, or policy the
   diff changes. Flags new public functions or error branches without unit
   tests, new endpoints or slices without integration tests, and assertions
   that can't catch a contract violation; include
   [TEST-CONTRACTS.md](../shared/TEST-CONTRACTS.md) in its prompt. Hands off
   failure, concurrency, load, and rollout (reliability) and attacker-driven
   misuse (security).
2. **Security:** *can an attacker or untrusted input make this code do
   something it shouldn't?* Owns trust boundaries, authentication and
   authorization, injection, information leaks, unsafe dependencies,
   fail-open behaviour, and resource use an attacker can inflate. Hands off
   cost under ordinary load (reliability).
3. **Reliability, performance, and rollout:** *does it keep working under
   failure, concurrency, load, and deployment?* Owns state transitions,
   concurrency, context propagation, retries, partial failure, atomicity,
   resource lifecycle, and unhandled error paths; a query or remote call per
   loop item (N+1), work growing faster than its input, hot-path allocation,
   missing pagination or indexes, and blocking calls on latency-sensitive
   paths; and migrations that lock, rewrite, or can't be undone, changes that
   break while old and new versions run side by side, and changes with no
   rollback path. Load `conventions-sql` first when SQL changed. Hands off
   error-handling style (maintainability).
4. **Maintainability and conventions:** *what does this cost the next person
   who changes it?* Owns consistency with project precedent, readability, API
   ergonomics, naming, error-handling style, observability conventions, idioms,
   and docs or comments the change left stale. Load the matching conventions
   skills first and judge against project rules over generic ones. For a
   consistency finding, use the precedent skill and cite at least two peer
   `file:line` locations; one peer is a coincidence. Hands off whether errors
   are handled at all (reliability).
5. **Spec and plan adherence** (only when step 2 found intent documents):
   *does the change deliver what its spec and plan promise, and do they
   agree?* Include the intent documents in its prompt. It checks:
   - **Milestones:** each milestone the change claims or ticks is met.
   - **Interfaces:** the code matches the plan's `Consumes` and `Produces`
     signatures.
   - **Unplanned files:** changed files absent from the plan's File Changes
     table or the task list.
   - **Task drift:** for a task list, the code departs from its verbatim tests
     or implementation.
   - **Scope excess:** work beyond the stated goal, reported without judging
     it.
   - **Spec conflict:** the project spec, living spec, docs, PR body, and code
     disagree, including unchanged code bound by a contract the diff changes.
   - **Delta sync:** every Behavioural Delta scenario appears in the living
     spec it names, and every behavioural edit to `docs/specs/` appears in a
     delta, as [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md) describes.

   If `--plan` was passed but nothing was found, skip it and say so once.

## Report template

Spec conflicts and delta-sync gaps rank with the other actionable items. The
other adherence checks go under Informational unless the user asked for strict
scope. If a reviewer hit its turn limit, add a `⚠️` line after "Subagent pass"
giving the original and retry limits and whether the retry completed.

````markdown
## {PR #<number> Review Summary: "<title>" | Code Review: <branch, "uncommitted", or path>}

- **Date:** {YYYY-MM-DD HH:MM}
- **Mode:** {remote PR | branch-diff | uncommitted | all-local | paths}
- **Base:** {merge-base ref, for branch-diff and all-local}
- **Files reviewed:** {count}

**Overall assessment:** {one or two sentences}

**Subagent pass:** {complete, or incomplete with what remains}

### Actionable Items

{Confirmed findings, High to Medium to Low: file and line, snippet, impact,
and the smallest viable correction.}

### Spec and Plan Adherence

{Only when that reviewer ran.}

- **Intent documents:** {paths}
- **Milestones:** …
- **Interfaces:** …
- **Unplanned files:** …
- **Task drift:** …
- **Scope excess:** …

### Informational / No Action Needed

{Brief observations needing no change.}

### Open Questions

{Unknowns that limited the review, and the evidence that would answer each.}

### Dropped by Verification

{One line per dropped finding: `file:line` — claim — why it was refuted, or
"None".}
````
