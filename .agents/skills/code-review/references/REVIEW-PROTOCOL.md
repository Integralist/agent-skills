# Review protocol

Read this guide for every code review. It contains the detailed intent inventory,
reviewer responsibilities, finding and verifier schemas, severity rules, and
report template. The skill entry point owns the review sequence and decision
gates.

## Gather review intent

Collect every intent document in this order:

1. The `--plan=<path>` file.
2. Project files in the diff, including under `projects/completed/`: a project
   the diff adds or moves is this change's contract, not history.
3. The plan named by an `Execution-Plan:` trailer in the reviewed commits.
4. A `projects/` link in the PR body.

For each plan or task list, also load its project's `spec.md` and the plan a
task list came from. Then add every living spec named under Living
Specifications, every `docs/specs/` file changed by the diff, and any living
spec whose contract covers the changed behaviour. Record an unknown if
applicability is unclear. A completed project outside the diff is history; its
living spec supersedes it. Read every document at the reviewed revision.

Write `CONTEXT_PATH` with the stated purpose, PR title and body, repository
instructions, each intent document labelled by path, and available test
results. Reviewers judge the change against this context; unclear intent is an
unknown, not a defect.

## Select and brief reviewers

Use scope and impact, not line count alone. Start one read-only generalist
reviewer for a localized, low-risk change. It covers behaviour and tests, then
security, reliability, and maintainability where relevant; include intent docs
and check adherence in that pass.

Add specialist reviewers only for concrete signals:

- **Security:** trust boundaries, authentication, untrusted input, or secrets.
- **Reliability:** persistence, concurrency, failures, external calls, scale,
  or rollout.
- **Maintainability:** broad refactors, new public APIs, or changes across
  modules.

Keep behaviour and tests in scope. Use a separate spec-and-plan reviewer only
when requirements are substantial or cross-cutting. A one-line authorization
change may need security review; a large mechanical change may not.

Always start a separate read-only conventions reviewer whenever applicable
conventions exist, even for small, low-risk changes. Select guidance with
[CONVENTIONS.md](CONVENTIONS.md). The conventions reviewer supplements the
generalist and any specialists.

Use [subagent steerability](../../shared/SUBAGENT-STEERABILITY.md) for turn
budgets and retries. Use the most capable available model for review judgment.
Give every reviewer:

- Its assigned questions, responsibilities, and handoffs.
- `DIFF_PATH`, `CONTEXT_PATH`, and the changed-file list. For diffs over about
  3000 lines, ask it to read file by file.
- Resolved convention paths and covered file/purpose scope; require reading
  applicable guidance.
- The finding schema below; judge the change against `CONTEXT_PATH`, treating
  unclear intent as an unknown rather than a defect; and review or explicitly
  skip every changed file.

Done when every reviewer is `COMPLETE`, every changed file has applicable
reviewer coverage, and applicable conventions are covered or marked as an
unresolved gap. Compare the conventions reviewer's loaded guidance with the
selection map; redirect or retry to close omissions. Unavailable guidance is
not a clean conventions pass.

## Reviewer profiles

The primary reviewer covers applicable questions; specialists own their
assigned lenses. A defect belongs to the profile whose question it answers.

1. **Behaviour and tests:** Does the change match `CONTEXT_PATH`, and do tests
   prove it? Own intended behaviour, logic errors, edge cases, regressions, and
   caller contracts. Check callers of changed exported symbols, signatures, or
   behaviour, including callers in unchanged files. Also check unchanged files
   bound by a changed spec, doc, or policy. Flag new public functions or error
   branches with no test reaching them through the public interface, endpoints
   or slices without integration tests, tests that pin unexported helpers or
   internal seams instead of the interface, and assertions that can't catch
   contract violations. Include
   [TEST-CONTRACTS.md](../../shared/TEST-CONTRACTS.md). Hand off failure,
   concurrency, load, and rollout to reliability; attacker-driven misuse to
   security.
2. **Security:** Can an attacker or untrusted input make the code do what it
   shouldn't? Own trust boundaries, authentication and authorization,
   injection, information leaks, unsafe dependencies, fail-open behaviour, and
   resource use an attacker can inflate. Hand off ordinary-load cost to
   reliability.
3. **Reliability, performance, and rollout:** Does the change work under
   failure, concurrency, load, and deployment? Own state transitions, retries,
   partial failure, atomicity, resource lifecycle, unhandled errors, N+1 work,
   superlinear work, hot-path allocation, missing pagination or indexes,
   blocking calls on latency-sensitive paths, risky migrations, old/new
   version compatibility, and rollback. Load `conventions-sql` first when SQL
   changed. Hand off documented error-handling style to conventions and
   unwritten precedent to maintainability.
4. **Maintainability:** What does this cost the next person changing it? Own
   module depth and seams
   ([code-module-design](../../code-module-design/SKILL.md)), readability,
   interface ergonomics, stale docs/comments, and unwritten precedent. Flag
   structural smells only when they carry a demonstrated cost in the diff:
   change amplification or poor locality (*Shotgun Surgery*, *Divergent Change*,
   *Repeated Switches*), leaked ownership or coupling (*Feature Envy*, *Insider
   Trading*, *Message Chains*, *Middle Man* pass-throughs, *Speculative
   Generality* with a one-adapter seam), fragile interfaces or state
   (*Mysterious Name*, *Data Clumps*, *Primitive Obsession*, *Long Parameter
   List*, *Flag Argument*, *Temporary Field*, *Mutable/Global Data*), or tests
   that pin internal helpers instead of the module interface. For an unwritten
   consistency finding, use precedent and cite at least two peer `file:line`
   locations; one peer is a coincidence. Hand off documented requirements to
   conventions and whether errors are handled to reliability.
5. **Conventions:** Does the code follow explicit applicable rules? Own
   documented naming, structure, idioms, error-handling style, comments,
   formatting, and test layout. Read selected skills and applicable references
   before auditing. Cite the rule and code evidence; check scope, precedence,
   and exceptions. Recommendations are not mandates; personal preferences are
   not findings. Hand off unwritten precedent to maintainability, and merge
   duplicate functional/security findings with their owning profiles.
6. **Spec and plan adherence:** Use only when step 2 found intent documents.
   Does the change meet the plan and spec, and do they agree? Check:
   - Each milestone the change claims or marks complete.
   - Plan `Consumes` and `Produces` signatures.
   - Changed files absent from the plan's File Changes table or task list.
   - Task-list drift from verbatim tests or implementation.
   - Scope excess, reported without judging it.
   - Conflicts among project/living specs, docs, PR body, and code, including
     unchanged code bound by a changed contract.
   - Every Behavioural Delta scenario appears in its named living spec, and
     every behavioural edit to `docs/specs/` appears in a delta, as
     [SPEC-FORMAT.md](../../shared/SPEC-FORMAT.md) describes.

If `--plan` was passed but no intent document was found, skip the separate
adherence review and say so once.

## Finding schema and severity

Every reviewer returns:

```json
{
  "status": "COMPLETE | INCOMPLETE",
  "files_reviewed": ["path/to/file"],
  "files_skipped": [
    { "file": "path/to/file", "reason": "why this profile doesn't apply" }
  ],
  "conventions_loaded": [
    { "path": "resolved/rule/path", "applies_to": ["changed file or purpose"] }
  ],
  "findings": [
    {
      "severity": "High | Medium | Low",
      "file": "path/to/file",
      "line": "approximate line or range",
      "snippet": "short relevant excerpt",
      "why": "why it matters",
      "suggestion": "smallest viable correction",
      "rule": {
        "source": "path/to/convention",
        "line": "line or range",
        "requirement": "the explicit rule violated"
      }
    }
  ],
  "unknowns": [
    { "question": "what couldn't be established", "why": "why it matters here" }
  ]
}
```

A documented-convention finding requires `rule`; omit it for other findings.
List only skills and references actually read in `conventions_loaded`; use an
empty array when none apply. Required but unread guidance is an unknown and
coverage gap.

**Severity** reflects impact and likelihood, not confidence:

- **High:** likely security compromise, data loss, outage, or broken core
  contract.
- **Medium:** demonstrated defect under plausible conditions.
- **Low:** contained cost without user-visible impact; minor defect, real
  maintainability/testability cost, or verified explicit convention violation.
  Exclude personal style preferences.

Suggestions should be the smallest viable correction. Include alternatives
only when they expose a real trade-off.

**Conflicting sources.** PR body, project spec, living spec, docs, and code all
state intent. When two disagree, report the contradiction with both sources.
A demonstrated contradiction is a finding whose correction names both options
(change the code or amend the spec); wording too vague to demonstrate one is an
unknown.

## Verify findings

Give each finding, or bounded batch, to a verifier subagent on the same model.
Tell it to refute the claim:

- Read cited lines and context at the reviewed revision.
- Refute if the code is unchanged and unbound by a changed contract, an existing
  guard/caller prevents the issue, the line is wrong, or the language/library
  is misread.
- “Intended” refutes only when a `CONTEXT_PATH` source states that intent and
  no other source contradicts it.
- For unwritten precedent, inspect every cited peer; refute unless at least two
  show the pattern.
- For documented conventions, check the rule citation, scope, exceptions, and
  precedence. Refute an inapplicable, misquoted, or overridden rule; explicit
  rules need no peer examples.
- Keep the worktree untouched: run Python as `python3 -B`, put scratch files in
  a temp directory, and confirm `git status` is unchanged.

Default to refuted unless demonstrably real. An unconfirmed High security
finding is unresolved; move it to open questions with evidence that would
settle it. Every finding needs a verdict. Each verifier returns:

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

## Report format

Keep real findings, apply corrected severity, merge duplicates across profiles,
sort High to Low, and list dropped findings with the verifier's reason. Offer
to address actionable findings. Every changed file must be accounted for;
unknowns stay separate from defects.

Spec conflicts and delta-sync gaps rank with other actionable findings. Put
other adherence checks under Informational unless strict scope was requested.
If a reviewer hits its turn limit, add a `⚠️` line after “Subagent pass” with
the original/retry limits and whether retry completed.

Use this template:

````markdown
## {PR #<number> Review Summary: "<title>" | Code Review: <branch, "uncommitted", or path>}

- **Date:** {YYYY-MM-DD HH:MM}
- **Mode:** {remote PR | branch-diff | uncommitted | all-local | execution | paths}
- **Base:** {merge-base or recorded execution baseline, when applicable}
- **Files reviewed:** {count}
- **Snapshot:** {reviewed HEAD and dirty/new content fingerprints}
- **Delivery scope:** {manifest, for execution reviews}

**Overall assessment:** {one or two sentences}

**Subagent pass:** {complete, or incomplete with what remains}

### Conventions Coverage

{List loaded rule paths and their file or purpose scope, plus skipped or missing guidance. Say when no conventions apply; unresolved gaps are not a clean pass.}

### Actionable Items

{Confirmed findings, High to Medium to Low: file and line, snippet, impact, and the smallest viable correction. Include the written rule citation for convention findings.}

### Spec and Plan Adherence

{Only when intent documents were found.}

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

{One line per dropped finding: `file:line` — claim — why it was refuted, or "None".}
````
