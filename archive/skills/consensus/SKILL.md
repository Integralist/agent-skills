---
name: consensus
description: >-
  Cross-model review of an assessment and its implementation, with
  discussion rounds and user approval gates. Use when a complex design or
  implementation needs independent review from other AI CLIs.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Consensus

You're the host agent. Use one or more consulting agents, other AI CLIs run
headlessly, as second reviewers of your assessment and your implementation,
with the user approving at a gate between phases. Advance a phase only when
every consultant has reviewed, discussion has converged or hit its cap, and
the user has approved.

**Workflow.** Use the variant the user asked for, and confirm one before
setup if they didn't: **full** (phase A and its gate, then phase B and its
gate), **assessment-only** (phase A to its gate, no implementation), or
**implementation-only** (phase B against an assessment or plan the user has
approved). **Single-agent** can modify any of them: cheaper and less diverse,
with the same phases and gates.

## Setup

**Consultants.** Use the CLIs the user names ("use agy and codex").
Otherwise detect them with `command -v agy gemini codex claude copilot`,
excluding the host. Prefer `agy` (Google Antigravity, the Gemini CLI's
successor) and skip `gemini` when both exist, to avoid duplicate Google
coverage. If several are found and the user has no preference, ask,
defaulting to all of them. If none are found, tell the user and ask whether
to install one or go ahead without consensus; never skip consultation
silently.

- `agy -p "<prompt>"`: reads stdin, appended to the prompt.
- `gemini -p "<prompt>" --output-format text`: reads stdin; use a
  single-quoted heredoc for the prompt body.
- `codex`: check `codex --help` before first use.
- `claude -p "<prompt>"`: reads stdin; an independent-context reviewer
  whatever the host.
- `copilot -p "<prompt>" --allow-all-tools`: GitHub Copilot CLI.
  `--allow-all-tools` is required headless, `-p` doesn't read stdin so put
  the diff in the prompt body, and `--model <id>` pins a model.
- Any other CLI: find its non-interactive prompt flag in `<cli> --help`
  rather than guessing.

**Prerequisites.** At least one consultant on PATH and the repo checked out
locally, so `git diff` means something. Consultants send content to
third-party APIs, so redact secrets, `.env` files, credentials, private
keys, or anything you wouldn't paste into a third-party service, or ask the
user before sending.

**Secondary lenses.** In A3 and B2, give each consultant one lens on top of
the full core focus, cycling when there are more consultants than lenses:
evidence gaps and known unknowns; failure modes and hidden costs; the
strongest success case and what to preserve; alternatives that change the
trade-off; process, reversibility, and the smallest useful next step.

## Phase A: assessment

1. **Discover,** in up to three rounds of reading code, tests, recent
   commits, and convention files. Round 1 forms a hypothesis; round 2
   attacks it (what it assumes, which edge cases break it, whether the
   rejected alternative was dropped for a concrete reason); round 3 runs
   only if round 2 found material gaps. If the plan has fuzzy terms or
   hasn't been tested against the domain model, run the grill-with-docs
   skill here with the user. If only a legacy `CONTEXT.md` exists, use it
   and warn the user with `⚠️` to rename it to `GLOSSARY.md`. Done at the
   first round with no new findings.
2. **Write the assessment,** specific enough to review: not "we will add a
   cache" but "in-process LRU keyed by `(tenant_id, query_hash)`, capacity
   10k, TTL 5m, in `internal/cache/query.go`". For a written plan or doc, run
   the critique skill on your draft first, so consultants spend their
   attention on harder problems. Done when it follows this shape:

   ```txt
   ## Problem
   <task in your own words, with constraints>

   ## Proposed approach
   <plan with specific files / functions / changes>

   ## Key decisions and trade-offs
   <each non-obvious choice with rejected alternatives and concrete reasons>

   ## Risks and open questions
   ```

3. **Consultant review.** Send each consultant the review prompt in
   parallel, so each reaches its own view first, with the A3 focus, its
   lens, and the assessment. Merge duplicate findings into one stronger
   finding, noting who raised it. Mark each finding **accept**, **reject
   with reason** (a concrete fact: file, behaviour, constraint, number), or
   **defer to user** (a judgment call). Done when every finding is marked.
4. **Discuss,** up to two rounds per consultant: send the rebuttal prompt
   only to those whose findings you rejected. Carry a disagreement between
   two consultants into the gate rather than resolving it yourself. Done
   when each dispute has converged or hit the cap.
5. **Gate.** Show the revised assessment, which reviewers contributed what,
   and an evidence ledger separating verified facts, assumptions, and
   unknowns. Show unresolved positions side by side, each classed as a
   factual dispute, a value or trade-off dispute, or missing evidence;
   investigate factual ones where you can, and leave value disputes to the
   user rather than researching them. Then stop: implementation waits for
   approval. Loop back to step 2 or 3 if the user wants changes, and stop
   entirely if they decline. Done when the user approves.

## Phase B: implementation

1. **Implement** the approved assessment or plan, then review your own
   diff with the code-review skill, so consultants focus on cross-model
   disagreement rather than the obvious. Done when the relevant tests,
   lint, and build pass, or the user accepts a documented blocker.
2. **Consultant review.** Pipe the diff to each consultant on stdin, which
   avoids quoting problems, with the review prompt, the B2 focus, its lens,
   and the approved artifact for intent. Merge and mark findings as in A3.
   Done when every finding is marked.
3. **Discuss** as in A4, then apply the accepted findings and rerun every
   check those edits affect. Done when every finding is accepted, rejected
   with evidence, or unresolved, and the required checks pass or the user
   accepts the blocker.
4. **Gate.** Present the final diff for the user to read with `git diff`,
   the checks and their results, the fixes attributed by consultant, and
   unresolved positions side by side. Then stop; the user does the final
   review. Done when that's presented.

## Prompts

**A3 focus:** whether the approach solves the stated problem; missed edge
cases and failure modes; wrong assumptions about the codebase, libraries, or
external systems; underweighted hidden complexity; alternatives rejected
without a concrete reason; missing risks; and the strongest part worth
keeping.

**B2 focus:** correctness and edge cases; race conditions; security
(injection, auth, secrets, fail-secure defaults, trust-boundary validation);
tests of failure modes, not just the happy path; convention compliance;
comment quality (a cold reader understands it, no LLM voice); and "compute,
don't justify": every throttle, retry, batch, timeout, and TTL has a number
with an operational reason.

**Review prompt** (A3 and B2):

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

**Rebuttal prompt** (A4 and B3):

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

**Invocation** (agy in B2, diff on stdin; replace `main` with the real base
branch, add `--output-format text` for `gemini`, and for a CLI that doesn't
read stdin, put the diff in the prompt body, minding quoting and size):

```bash
MERGE_BASE=$(git merge-base main HEAD)
git diff "$MERGE_BASE"...HEAD | agy -p "$(cat <<'PROMPT'
<the review prompt above, with {focus} and {artifact} substituted>
PROMPT
)"
```

## Discipline

- **Every claim is a hypothesis until verified,** yours and theirs. Memory
  against memory isn't a rebuttal: cite a `grep` result, `--help` output, a
  doc fetched this session, or behaviour seen in a real run. Spot-check both
  sides: a claimed flag means running `--help`, "line N has a bug" means
  reading line N.
- **Same bar both ways.** Consultants have no memory of the diff, so
  they're likelier than you to catch a miss and likelier to make things up.
- **Judge each finding on its own;** five findings aren't five accepts. Hold
  your position when you can't state a fact that beats the consultant's, and
  let it go to unresolved.
- **Show disagreements between consultants side by side** rather than
  blending them. Facts need evidence, values and trade-offs need the user,
  and unknowns need the smallest step that would resolve them.
- **Never write a consultant's response yourself.** If a CLI fails
  (network, quota, syntax, prompt size), show the error and ask whether to
  retry, drop that consultant, or go ahead without consensus.
