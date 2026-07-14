---
name: consensus
description: Cross-model consensus review with discussion rounds and user gates.
disable-model-invocation: true
---

# Consensus

You are the **host agent** (the harness running this skill). You
orchestrate one or more **consulting agents** — other AI CLIs invoked
headlessly — as second reviewers on both your assessment and your
implementation, with user-approval gates between phases.

Advance phases only when (a) every consulting agent has reviewed, (b)
discussion has converged or hit the cap, and (c) the user has approved at
the gate.

## Select The Workflow

Use the variant the user requested. If none was specified, confirm one before
setup:

- **Full** — Phase A and its gate, then Phase B and its gate
- **Assessment-only** — Phase A through A5; no implementation
- **Implementation-only** — Phase B against a user-approved implementation
  artifact: an assessment or plan

**Single-agent** is a modifier for any variant. It lowers cost and feedback
diversity without changing the phases or gates.

## Setup

**Select consultants** in this order:

1. User-specified ("use agy" / "use agy and codex").
1. Detected on PATH: `command -v agy gemini codex claude copilot`. Exclude
   the host itself. **Prefer `agy` over `gemini`** — Google Antigravity
   (`agy`) is the successor to the Gemini CLI; if both are installed, use
   `agy` and skip `gemini` to avoid duplicate Google-model coverage. Fall
   back to `gemini` only when `agy` is absent.
1. If multiple detected and no preference stated, ask. Default: all
   detected (after the agy/gemini dedupe).

If zero CLIs resolve, tell the user and ask whether to install one or
proceed without consensus. Never silently skip consultation.

**Detectable agent CLIs:**

| CLI       | Headless invocation                         | Reads stdin?   | Notes                                                                                                                                                                                                        |
| --------- | ------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agy`     | `agy -p "<prompt>"`                         | Yes (appended) | Google Antigravity CLI — successor to `gemini`. Prefer over `gemini` when both are installed.                                                                                                                |
| `gemini`  | `gemini -p "<prompt>" --output-format text` | Yes (appended) | Google's Gemini CLI. Use single-quoted heredoc for the prompt body. Skip if `agy` is present.                                                                                                                |
| `codex`   | Verify with `codex --help` before first use | Verify         | OpenAI's Codex CLI.                                                                                                                                                                                          |
| `claude`  | `claude -p "<prompt>"`                      | Yes            | Claude Code in headless mode. Useful as an independent-context reviewer regardless of the host.                                                                                                              |
| `copilot` | `copilot -p "<prompt>" --allow-all-tools`   | No             | GitHub Copilot CLI (ChatGPT models). `--allow-all-tools` required for non-interactive mode; substitute the diff into the prompt body — `-p` does not read stdin. Use `--model <id>` to pin a specific model. |

For any CLI not listed, run `<cli> --help` and look for a
non-interactive/prompt flag. Do not guess flags.

**Prerequisites:** at least one consultant on PATH, repo available locally
(so `git diff` is meaningful), and **no secrets** in the assessment or
diff. Consulting agents send content to third-party APIs — if the diff
includes `.env` files, credentials, private keys, or anything you would
not paste into a third-party service, redact or ask the user before
sending.

## Phase A — Assessment

**A1. Discovery (≤3 rounds).** Read relevant code, tests, recent commits,
and convention files. Round 1: form a hypothesis. Round 2: attack it —
what does it assume, what edge cases break it, was the rejected
alternative dismissed for a concrete reason? Round 3 only if round 2
surfaced material gaps. Stop at the first round with no new findings.

If the plan has fuzzy terminology or hasn't been stress-tested against the
project's domain model, explicitly invoke `grill-with-docs` here. It's a
host-side, user-interactive step — it sharpens vocabulary against `CONTEXT.md`
and surfaces unstated assumptions before consultants see anything.

**A2. Write the assessment** as a concrete artifact:

```txt
## Problem
<task in your own words, with constraints>

## Proposed approach
<plan with specific files / functions / changes>

## Key decisions and trade-offs
<each non-obvious choice with rejected alternatives and concrete reasons>

## Risks and open questions
```

Be specific. "We will introduce a cache" is too vague; "in-process LRU
keyed by `(tenant_id, query_hash)`, capacity 10k, TTL 5m, in
`internal/cache/query.go`" is reviewable.

If the artifact is a written plan or doc, explicitly invoke `critique` against
your own draft before A3. It catches logical fallacies and structural
weaknesses cheaply with one model so consultants spend attention on harder
things.

**A3. Consultant review.** Send each selected CLI the review prompt below
with `{focus}` = assessment focus list, `{secondary_lens}` = one rotating lens
from the list below, and `{artifact}` = the A2 assessment. Run consultants in
parallel so each reaches an independent recommendation before seeing any other
opinion. Dedupe findings across agents — duplicates become one stronger
finding; note which agent(s) raised each.

For A3 and B2, assign secondary lenses across consultants, cycling when there
are more agents than lenses:

- Evidence gaps and known unknowns
- Failure modes and hidden costs
- Strongest success case and what should be preserved
- Alternative approaches that change the trade-off
- Process, reversibility, and the smallest useful next step

Each consultant reviews the full core focus. The secondary lens adds breadth;
it does not replace the common review.

Categorize each finding: **Accept** (integrate), **Reject with reason**
(concrete fact: file, behavior, constraint, number), or **Defer to user**
(judgment call).

**A4. Discussion (≤2 rounds per agent).** For each agent whose findings
you rejected, send back the rebuttal prompt below — only to the agent(s)
that raised the disputed findings. If two agents disagree with each other,
carry that disagreement into A5; do not resolve it yourself.

**A5. Gate — present consensus.** Show the user: revised assessment,
"Reviewers contributed" attribution, and an evidence ledger that separates
verified facts, assumptions, and unknowns. Present unresolved positions
side-by-side and classify each as a factual dispute, value/trade-off dispute,
or missing evidence. Investigate factual disputes when feasible; do not pretend
value disputes can be resolved by more research. **Stop. Do not begin
implementation before the gate.** If the user wants changes, loop back to A2
or A3. If the user declines, stop entirely.

## Phase B — Implementation

**B1. Implement** the approved implementation artifact. Apply your normal
review pass before handing the diff to consultants — consultant review is on
top of self-review, not a substitute. Run `code-review` against your own diff
here; it parallelizes review dimensions within one model and catches the
obvious stuff so consultants in B2 focus on cross-model disagreement. Run the
repository's relevant tests, lint, and build checks; do not advance until they
pass or the user accepts a documented blocker.

**B2. Consultant review.** Pipe the diff to each consultant on stdin
(avoids quoting issues). Use the review prompt with `{focus}` = diff focus
list, `{secondary_lens}` = the assigned rotating lens, and `{artifact}` = the
approved implementation artifact (for intent context). Dedupe findings as in
A3.

Diff focus: correctness and edge cases; race conditions; security
(injection, auth, secrets, fail-secure defaults, trust-boundary
validation); test coverage of failure modes (not just happy path);
convention compliance; comment quality (cold-reader test, no LLM voice);
"compute don't justify" — every throttle/retry/batch/timeout/TTL has a
number with operational justification.

**B3. Discussion (≤2 rounds per agent).** Same protocol as A4. Account for every
finding as accepted, rejected with evidence, or unresolved. Apply accepted
findings, then rerun every relevant check affected by those edits. Do not
advance while a required check fails unless the user accepts the documented
blocker.

**B4. Gate — present consensus-reviewed code.** Final diff (user runs
`git diff`), checks run and results, summary of fixes attributed by agent, and
"Unresolved" with positions side-by-side. Completion requires every finding
accounted for and all required checks passing or explicitly accepted as
blocked. Stop. The user does final review.

## Prompt templates

**Review prompt** (used in A3 and B2):

```txt
**Review-only — do not modify code or run tools that change state.** Produce written findings only. Do not edit files, run build/test/format commands, create commits, or otherwise change the workspace. The host agent owns all implementation. Read-only investigation (file reads, `grep`, `--help`) is fine. Respond with text only.

You are a senior engineer reviewing {artifact_label}. Be specific and rigorous.

Before critiquing, independently state:
- Your recommended approach
- Your confidence (high / medium / low)
- The decisive evidence
- The most important unknown

Focus:
{focus}

Secondary lens:
{secondary_lens}

Identify the strongest part of the proposal and what should be preserved before
listing problems. Categorize each finding as Critical / Important / Minor. Cite
a specific file, function, or line so the author can act on it. Separate
verified facts, assumptions, and unknowns. Do not rubber-stamp — only conclude
"looks solid" after attempting each focus area.

{artifact_label} under review:
---
{artifact}
---
```

A3 focus: whether the approach solves the stated problem; missed edge cases and
failure modes; faulty assumptions about the codebase, libraries, or external
systems; underweighted hidden complexity; alternatives rejected without
concrete reason; missing risks; and the strongest part worth preserving.

B2 focus: see B2 list above.

**Rebuttal prompt** (used in A4 and B3):

```txt
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

For `gemini` (when `agy` is not installed), append `--output-format text`.
Replace `main` with the actual base branch. For other CLIs, adapt per the
Setup table; if a CLI doesn't read stdin, substitute the diff into the
prompt body (mind quoting and size limits).

## Discipline checklist

- **Every claim is a hypothesis until verified.** Yours and the
  consultant's. Memory vs. memory is not a rebuttal — cite a `grep`
  result, `--help` output, docs URL fetched this session, or behavior
  observed in a real run.
- **Spot-check hallucinations on either side.** "CLI takes flag `--foo`" →
  run `--help`. "API rejects X" → check docs or test it. "Line N has a
  bug" → read line N. "Missing import X" → grep for X.
- **Consultants have no working memory of the diff** — more likely than
  you to catch what you missed, *and* more likely to fabricate. Same
  evidentiary bar both ways.
- **Don't over-defer.** If you can't state a fact that beats the
  consultant's, hold your position and let it become Unresolved.
- **Independent judgment per finding.** Five findings ≠ five accepts.
- **No forced cross-agent reconciliation.** When two consultants disagree,
  present both positions; do not synthesize.
- **Separate kinds of disagreement.** Facts need evidence; values and
  trade-offs need a user decision; unknowns need the smallest useful
  evidence-gathering step.
- **No phase skipping.** Don't begin implementation while waiting for the
  gate, even if approval feels foregone.
- **Never write a consultant's response yourself.** If a CLI fails
  (network, quota, syntax, prompt size), surface the error and ask whether
  to retry, drop that agent, or proceed without consensus.
