---
name: consensus
description: Multi-agent deliberative workflow for non-trivial tasks. The host agent assesses → consulting CLI agents review → discuss to consensus → user approves → host implements → consulting agents review the diff → discuss to consensus → user does final review. Round caps prevent ping-pong; unresolved dissent is surfaced, not synthesized away.
when_to_use: Only after the user has explicitly confirmed it for the current task. Suitable for architectural changes, multi-file features, unclear-root-cause bug investigations, design decisions, behavior-changing refactors. Skip for typos, single-line fixes, comment-only edits, formatting, renames, or throwaway snippets.
---

You are the **host agent** (the harness currently running this skill). You orchestrate one or more **consulting agents** — other AI CLIs invoked headlessly — as second-reviewers on both your assessment and your implementation, with explicit user-approval gates between phases.

Progress through phases only when (a) every consulting agent has reviewed, (b) discussion has converged or hit the cap, and (c) the user has approved at the gate.

## Setup

**Select consultants** in this order:

1. User-specified ("use agy" / "use agy and codex").
2. Detected on PATH: `command -v agy gemini codex claude`. Exclude the host itself from the candidates. **Prefer `agy` over `gemini`** — Google Antigravity (`agy`) is the successor to the Gemini CLI; if both are installed, use `agy` and skip `gemini` to avoid duplicate Google-model coverage. Fall back to `gemini` only when `agy` is absent.
3. If multiple detected and no preference stated, ask the user. Default: all detected (after the agy/gemini dedupe above).

If zero CLIs resolve, tell the user and ask whether to install one or proceed without consensus. Never silently skip consultation.

**Detectable agent CLIs:**

| CLI      | Headless invocation                          | Reads stdin?   | Notes                                                                                            |
|----------|----------------------------------------------|----------------|--------------------------------------------------------------------------------------------------|
| `agy`    | `agy -p "<prompt>"`                          | Yes (appended) | Google Antigravity CLI — successor to `gemini`. Prefer over `gemini` when both are installed.    |
| `gemini` | `gemini -p "<prompt>" --output-format text`  | Yes (appended) | Google's Gemini CLI. Use single-quoted heredoc for the prompt body. Skip if `agy` is present.    |
| `codex`  | Verify with `codex --help` before first use  | Verify         | OpenAI's Codex CLI.                                                                              |
| `claude` | `claude -p "<prompt>"`                       | Yes            | Claude Code in headless mode. Useful as an independent-context reviewer regardless of the host.  |

For any CLI not listed, run `<cli> --help` and look for a non-interactive/prompt flag. Do not guess flags.

**Prerequisites:** at least one consultant on PATH, repo available locally (so `git diff` is meaningful), and **no secrets** in the assessment or diff. Consulting agents send content to third-party APIs — if the diff includes `.env` files, credentials, private keys, or anything you would not paste into a third-party service, redact or ask the user before sending.

## Phase A — Assessment

**A1. Discovery (≤3 rounds).** Read relevant code, tests, recent commits, and convention files. Round 1: form a hypothesis. Round 2: attack it — what does it assume, what edge cases break it, was the rejected alternative dismissed for a concrete reason? Round 3 only if round 2 surfaced material gaps. Stop at the first round with no new findings.

If the plan has fuzzy terminology or hasn't been stress-tested against the project's domain model, run `grill-with-docs` here. It's a host-side, user-interactive step — it sharpens vocabulary against `CONTEXT.md` and surfaces unstated assumptions before consultants see anything.

**A2. Write the assessment** as a concrete artifact:

```
## Problem
<task in your own words, with constraints>

## Proposed approach
<plan with specific files / functions / changes>

## Key decisions and trade-offs
<each non-obvious choice with rejected alternatives and concrete reasons>

## Risks and open questions
```

Be specific. "We will introduce a cache" is too vague; "in-process LRU keyed by `(tenant_id, query_hash)`, capacity 10k, TTL 5m, in `internal/cache/query.go`" is reviewable.

If the artifact is a written plan or doc, run `critique` against your own draft before A3. It catches logical fallacies and structural weaknesses cheaply with one model so consultants spend their attention on harder things.

**A3. Consultant review.** Send each selected CLI the review prompt below with `{focus}` = assessment focus list and `{artifact}` = the assessment from A2. Run consultants in parallel (separate Bash calls in one message). Dedupe findings across agents — duplicates become one stronger finding; note which agent(s) raised each.

Categorize each finding: **Accept** (integrate), **Reject with reason** (concrete fact: file, behavior, constraint, number), or **Defer to user** (judgment call).

**A4. Discussion (≤2 rounds per agent).** For each agent whose findings you rejected, send back the rebuttal prompt below. Send rebuttals only to the agent(s) that raised the disputed findings. If two agents disagree with each other, carry that disagreement into A5 — do not resolve it yourself.

**A5. Gate — present consensus.** Show the user: revised assessment, "Reviewers contributed" attribution, and "Unresolved" (your-vs-agent or agent-vs-agent) with positions side-by-side. **Stop. Do not begin implementation before the gate.** If the user wants changes, loop back to A2 or A3. If the user declines, stop entirely.

## Phase B — Implementation

**B1. Implement** the approved assessment. Apply your normal review pass before handing the diff to consultants — consultant review is on top of self-review, not a substitute. Run `code-review` against your own diff here; it parallelizes review dimensions within one model and catches the obvious stuff so consultants in B2 focus on cross-model disagreement.

**B2. Consultant review.** Pipe the diff to each consultant on stdin (avoids quoting issues). Use the review prompt with `{focus}` = diff focus list and `{artifact}` = the approved assessment (for intent context). Dedupe findings as in A3.

Diff focus: correctness and edge cases; race conditions; security (injection, auth, secrets, fail-secure defaults, trust-boundary validation); test coverage of failure modes (not just happy path); convention compliance; comment quality (cold-reader test, no LLM voice); "compute don't justify" — every throttle/retry/batch/timeout/TTL has a number with operational justification.

**B3. Discussion (≤2 rounds per agent).** Same protocol as A4. Apply accepted findings to the diff before B4.

**B4. Gate — present consensus-reviewed code.** Final diff (user runs `git diff`), summary of fixes attributed by agent, and "Unresolved" with positions side-by-side. Stop. The user does final review.

## Prompt templates

**Review prompt** (used in A3 and B2):

```
**Review-only — do not modify code or run tools that change state.** Produce written findings only. Do not edit files, run build/test/format commands, create commits, or otherwise change the workspace. The host agent owns all implementation. Read-only investigation (file reads, `grep`, `--help`) is fine. Respond with text only.

You are a senior engineer reviewing {artifact_label}. Be specific and rigorous.

Focus:
{focus}

Categorize each finding as Critical / Important / Minor. Cite a specific file, function, or line so the author can act on it. Do not rubber-stamp — only conclude "looks solid" after attempting each focus area.

{artifact_label} under review:
---
{artifact}
---
```

A3 focus: missed edge cases / failure modes; faulty assumptions about codebase, libraries, or external systems; underweighted hidden complexity; better alternatives rejected without concrete reason; missing risks; whether the approach actually solves the stated problem.

B2 focus: see B2 list above.

**Rebuttal prompt** (used in A4 and B3):

```
**Review-only — do not modify code or run tools that change state.** Discussion round; respond with text only. Read-only investigation is fine.

Earlier you reviewed:
---
<artifact>
---

You raised:
---
<that agent's findings>
---

My response per finding:
---
<accepted | rejected because <concrete reason>>
---

For each finding I rejected, do you accept my reasoning, or still disagree? If still disagreeing, give your strongest counter-argument grounded in a specific fact (file, behavior, constraint). If you accept all my reasoning, say so explicitly.
```

**Canonical invocation** (agy, B2 — diff on stdin):

```bash
MERGE_BASE=$(git merge-base main HEAD)
git diff "$MERGE_BASE"...HEAD | agy -p "$(cat <<'PROMPT'
<the review prompt above, with {focus} and {artifact} substituted>
PROMPT
)"
```

For `gemini` (when `agy` is not installed), append `--output-format text` to the invocation above.

Replace `main` with the actual base branch. For other CLIs, adapt per the Setup table; if a CLI doesn't read stdin, substitute the diff into the prompt body (mind quoting and size limits).

## Discipline checklist

- **Every claim is a hypothesis until verified.** Yours and the consultant's. Memory vs. memory is not a rebuttal — cite a `grep` result, `--help` output, docs URL fetched this session, or behavior observed in a real run.
- **Spot-check hallucinations on either side.** "CLI takes flag `--foo`" → run `--help`. "API rejects X" → check docs or test it. "Line N has a bug" → read line N. "Missing import X" → grep for X.
- **Consultants have no working memory of the diff** — more likely than you to catch what you missed, *and* more likely to fabricate. Same evidentiary bar both ways.
- **Don't over-defer.** If you can't state a fact that beats the consultant's, hold your position and let it become Unresolved.
- **Independent judgment per finding.** Five findings ≠ five accepts.
- **No forced cross-agent reconciliation.** When two consultants disagree, present both positions; do not synthesize.
- **No phase skipping.** Don't begin implementation while waiting for the gate, even if approval feels foregone.
- **Never write a consultant's response yourself.** If a CLI fails (network, quota, syntax, prompt size), surface the error and ask whether to retry, drop that agent, or proceed without consensus.

## Lightweight variants

Offer when the full two-phase workflow is overkill:

- **Implementation-only**: skip Phase A; Phase B as second-opinion code review. Good when the plan is obvious.
- **Assessment-only**: Phase A, then implement without B2/B3. Good when implementation is mechanical once the plan is right.
- **Single-agent**: one consultant instead of all detected. Lower latency and cost; less feedback diversity.
