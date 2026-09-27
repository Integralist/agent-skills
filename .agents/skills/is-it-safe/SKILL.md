---
name: is-it-safe
description: >-
  Analyze the worst credible consequence of committing or merging a code
  change. Invoke manually with /is-it-safe for the current branch or a specified
  pull request.
disable-model-invocation: true
argument-hint: "[PR URL | PR number | commit/range | base ref]"
---

# Is It Safe?

Answer one question: **what is the worst credible outcome if these exact
changes are committed or merged?** Trace a concrete failure path and its impact.
This is an adversarial impact analysis, not a general code review or a risk
matrix. Focus the report on the strongest evidence-backed concern, not a long
catalogue of hypothetical risks.

## Timing

At the start of every run, record the Unix time with `date +%s`. Immediately
before writing the final report, record it again and calculate elapsed
wall-clock time. Include investigation and tool calls. Report
the duration for every outcome, including `UNKNOWN` and no pending changes.
If no reliable clock is available, report that timing could not be measured;
do not estimate.

## Resolve the change under review

1. **No argument:** inspect the current branch and local worktree. Use the
   branch's upstream tracking ref as the baseline. Include commits on the
   current branch that are not in that upstream, staged and unstaged tracked
   changes, and untracked non-ignored files. Keep committed branch changes and
   worktree changes distinct while analyzing them.

   When the current branch is the default branch, compare local `HEAD` with its
   remote-tracking upstream (for example, local `main` with `origin/main`). Do
   not compare the branch name with itself. If no upstream is configured, use a
   remote default-branch ref only when it is identifiable and provides a sound
   baseline. Use locally available refs; mention that a remote-tracking ref may
   be stale rather than silently treating it as current.

   If there are no unpushed commits or worktree changes, report that there is
   no pending change to assess. Ask for a commit SHA, range, or PR if the user
   wants an already-pushed change assessed. Never assume the latest commit is
   the intended target.

2. **PR URL or number:** retrieve the PR metadata and actual diff using
   read-only GitHub tools. Prefer these commands for PR metadata and the diff:

   ```sh
   gh pr view "$PR" --json \
     number,title,state,baseRefName,headRefName,baseRefOid,headRefOid,url
   gh pr diff "$PR"
   ```

   Review that PR, not the current checkout as a substitute.

   Use `gh api` only when the needed information is not available through those
   commands. Check the endpoint and its response semantics before interpreting
   errors. Encode slash-containing branch names when they are a single REST
   path parameter, or list branches and filter for an exact name. A 404 from a
   branch-protection endpoint can mean the branch is not protected; do not
   treat every 404 as proof that a branch or PR is missing. Prefer the PR's
   reported head metadata over assuming a branch exists.

   Use valid jq string escapes. For literal substring matches, use
   `contains("text")`; `"\."` is invalid in a jq string. Treat a failed API
   request or jq expression as a failed query, not evidence about the change.
   Correct the query if the result matters. If the PR or diff still cannot be
   accessed, return `UNKNOWN` and say what access or input is missing.

3. **Commit, range, or base ref:** assess exactly the requested target. For an
   explicit commit range, do not silently add unrelated worktree changes. For a
   base ref, compare it with `HEAD` and include local worktree changes, noting
   each scope in the report.

**Done when:** the exact diff and its baseline are identified, or the report
clearly says why they could not be identified.

## Trace the worst credible outcome

1. Read the full diff, change intent, and the files it touches. Follow a
   caller, consumer, invariant, configuration, or deployment or rollback path
   only when it can change the verdict. Scale the investigation to the diff: a
   few-line change needs a handful of lookups, not a repository survey. Batch
   independent reads and queries into one step, and reuse evidence already
   gathered rather than fetching it again.

2. Look for a plausible path to material harm, including data loss or
   corruption, unauthorized access or disclosure, broad availability or
   performance failure, broken compatibility, and irreversible or costly
   external effects. Use these as search prompts, not as a checklist to dump
   into the report.

3. For the strongest candidate, trace the chain:
   **trigger → changed behavior → affected system or users →
   consequence**.
   Establish preconditions, blast radius, and guards or recovery paths from
   code or other evidence. A dramatic outcome without a reachable,
   evidence-backed path is speculation; exclude it or label the unresolved
   condition explicitly.

4. Try to disprove the candidate. Check relevant callers, validations, feature
   gates, tests, and safeguards. Run a targeted test only when it can answer a
   material question and the runner provides a disposable sandbox with no access
   to host files outside the checkout, host credentials, or production systems.
   Confirm these protections from runner configuration or authoritative docs.
   If you cannot confirm them, skip the test and report why. Passing tests do
   not establish that a change is safe.

5. Separate verified facts from assumptions. Cite repository evidence as
   `path/to/file.ext:line`; cite the PR or test evidence when relevant. If
   missing context prevents a sound conclusion, state the specific unknown
   rather than filling it in by guesswork.

**Done when:** each reported failure path has a concrete trigger and causal
path, safeguards have been checked, and decision-relevant unknowns are explicit.
Stop gathering evidence once the strongest candidate is confirmed or refuted;
more breadth does not raise confidence in the verdict. If no credible failure
path remains, report that directly.

## Verdicts

Choose one verdict based on the evidence. Do not calculate a numeric score or
present an impact/likelihood matrix.

- 🟢 **PROCEED** — no concrete material failure path was found in the
  inspected scope. This is not a guarantee that the change is risk-free.
- 🟡 **HOLD** — a credible material risk needs mitigation or an explicit
  decision before commit or merge, but the evidence does not establish a
  release-blocking outcome.
- 🔴 **STOP** — evidence establishes a severe, release-blocking consequence
  without an effective safeguard. Recommend against committing or merging
  until it is addressed.
- ⚪ **UNKNOWN** — the target, source, or critical behavior could not be
  assessed reliably. Explain the missing access or evidence; `UNKNOWN` is not a
  claim that the change is safe or unsafe.

Use the colored emoji markers beside the bold verdict. Markdown does not provide
portable text colors, so do not rely on styling the verdict word itself.

## Report

Keep the report concise and lead with the verdict. Apply
[`product-voice`](../product-voice/SKILL.md) to explanatory prose: write for a
human who may act on it, use plain language, and name who does what, under which
condition, and with what observable impact. Explain unfamiliar terms. Preserve
the causal path, preconditions, file-and-line evidence, uncertainty, and
mitigation so another agent can act on the report. Report the single worst
credible outcome first; include another concern only if independently material.
Do not pad a `PROCEED` report with generic risks.

Prefer concrete wording. For example, replace "Contributor-controlled test
code could expose credentials" with: "If we run the PR's test without
isolation, code from the PR runs on the test machine. It could read credentials
stored there or change files available to that account. Run it only in an
isolated environment without credentials; otherwise, skip it."

For **Model**, report the session's exact model ID and effort level. Read
effort from `$CLAUDE_EFFORT` in Claude Code or `$PI_REASONING_LEVEL` in Pi.
Write `effort unknown` only when neither can be read.

Use level-3 headings (`###`) in the report, selecting the template that
matches the verdict:

### Template for 🟡 HOLD or 🔴 STOP

````markdown
### Verdict

🟡 **HOLD** (or 🔴 **STOP**) — <one-sentence recommendation and scope
reviewed>

- **Model:** <exact model ID and effort used, e.g. gemini-3.8-flash
  (high effort)>
- **Elapsed:** <measured duration, e.g. 2m 30s>

### Worst thing that could happen

<State the consequence in plain language. Name who or what would be affected.>

### How it could happen

<Trigger → changed behavior → impact, including important preconditions
and blast radius. Cite the relevant code and safeguards.>

### Before commit or merge

<State the smallest useful mitigation, decision, or verification.>

### What I couldn't confirm

<List only unknowns that could change the verdict. Omit when none remain.>
````

### Template for 🟢 PROCEED

````markdown
### Verdict

🟢 **PROCEED** — <one-sentence recommendation and scope reviewed>

- **Model:** <exact model ID and effort used, e.g. gemini-3.8-flash
  (high effort)>
- **Elapsed:** <measured duration, e.g. 2m 30s>

### Why no material risk was found

<Explain why no concrete material failure path is reachable. Name what was
checked and why the changed behavior remains bounded.>

### Verified safeguards

<Cite code, tests, configuration, or execution guards that keep the change
safe, with path:line citations.>

### What I couldn't confirm

<List only unknowns that could change the verdict. Omit when none remain.>
````

### Template for ⚪ UNKNOWN

````markdown
### Verdict

⚪ **UNKNOWN** — <one-sentence summary of what could not be assessed>

- **Model:** <exact model ID and effort used, e.g. gemini-3.8-flash
  (high effort)>
- **Elapsed:** <measured duration, e.g. 2m 30s>

### Why this could not be assessed

<Explain why the target, source, or critical behavior could not be evaluated
reliably. Name the missing access, unresolvable ref, or unavailable evidence.>

### What is needed to proceed

<State the specific input, permission, or command needed to unblock review.>
````

## Boundaries

- Keep the analysis read-only: do not edit files, approve, commit, push, or
  merge. Post a PR comment only after the user explicitly approves it below.
- Review consequences and reachability, not style or unrelated maintainability
  issues.
- Do not equate a test gap with proof of a defect, or a passing test suite with
  proof of safety.
- Do not claim absolute safety. Say what was inspected and what evidence
  supports the verdict.

## PR comment

After finishing the report for a PR, end by asking:

> 💬 Should I post a review comment to the PR?

Wait for the user's answer. Post nothing unless they explicitly approve. If
approved, post one top-level PR comment, not inline comments. Start the comment
with this line, filling in the model ID and effort from the report's **Model**:

```txt
🤖 This review was written by an LLM agent (`<model ID>`, <effort> effort).
```

Then include the relevant verdict and the report sections matching that
verdict, omitting **Model** and **Elapsed**. Keep
file-and-line citations and actual change risks, safeguards, or missing
requirements. If the PR cannot be accessed or the comment cannot be
posted, explain that rather than claiming it was posted.
