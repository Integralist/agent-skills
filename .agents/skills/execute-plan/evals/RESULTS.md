# Execute Plan Validation

> [!NOTE]
> These results cover the execute-plan version before the 2026-10-16 rewrite.
> The current `evals.json` scenarios haven't been run yet.

- **Date:** 2026-10-13
- **Scope:** source wiring, model policy, and read-only workflow simulations
- **Original simulation model:** requested `github-copilot/gpt-6.1-sol`, `xhigh`
- **Grading and auto simulation model:** requested `github-copilot/gpt-6-luna`,
  `xhigh`

## Checks

`make check-execute-plan` passes nineteen checks covering invocation, shared
procedures, manual high-level-plan execution, Claude readiness/authorization,
model drift, review/resume gates, residual routing, task commit safety, Git
review-index commands, milestone/task separation and mapping, legacy resume,
and nested-example-aware file/heading links. Five auto-mode checks cover
explicit aliases/default mode, bounded standing authority, durable decision
records, continuation/blockers/retries, and compiler/worker/adapter handoffs.
Their assertions failed against the original instructions and auto-reference
stub before implementation; mutations also detect removed safeguards.
The task-commit requirements failed assertions before implementation. The initial skill stub,
broken moved heading link, and manual-mode regression were also reproduced
before correction. Source-contract checks do not prove an LLM follows every
instruction.

An isolated temporary Git fixture creates task, boundary, correction, and
unrelated commits. It exercises actual Git trailer recovery and the documented
short-hash/title command, retaining the correction and excluding the unrelated
commit without creating duplicates. This validates those Git commands, not
live coordinator staging, provider execution, hooks, or full resume recovery.

Pi's actual skill loader discovers `execute-plan` with no diagnostics and
keeps it out of automatic model invocation. The actual loader also discovers
updated planning/manual helper skills with their original invocation settings.
`make check-specs`, Markdown lint (MD013/MD041 excluded), and woke pass.
The task template retains 31 pre-existing MD010 warnings from Go tabs inside
its nested example; baseline and current counts match. Its lint check excludes
MD010 separately rather than altering the unchanged Go code. Alex reports technical-word
warnings such as "execute" and "failure"; those are not treated as product
terminology defects or represented as a clean lint result.

## Original slice simulations

Before the task-commit update, each case ran once with the skill and once
without it. Independent grading checked the then-current assertions. These
historical results do not validate the updated task-commit flow; the first
three prompts in [evals.json](evals.json) now reflect the new contract and
have not been rerun.

| Case | With skill | Baseline |
| --- | --- | --- |
| JIT compilation after correction and acceptance | 3/3 | 2/3 |
| Old extension refuses premium fallback | 3/3 | 2/3 |
| Resume rejects unsupported completion claims | 3/3 | 3/3 |
| Total | 9/9 | 7/9 |

The baseline omitted an explicit whole-plan audit and a concrete extension
update/reload action. Several assertions pass both configurations. One run per
case does not establish statistical improvement. Traces use declared outcomes,
not observed implementation-worker model settings or actual test results.
Timing, token usage, and realized cost were not measured.

## Task-commit simulations

Three new current-skill simulations exercised task commit failure, recovery
and complete commit reporting, and preservation of user staging. Independent
read-only grading passed all nine declared-outcome assertions. They confirmed
that a failed task commit blocks the next task; a missing success record is
recovered without duplication; corrections/bookkeeping/no-change tasks appear
in the report; and unrelated user work is not staged or attributed.

The scenarios strongly cue the policy, so these passes are limited evidence of
generalization. Old-skill comparison runs were not graded: their reconstructed
snapshot included updated compiler instructions and is not a valid baseline.
No timing/cost improvement is claimed. Outputs and the review viewer remain in
private temporary storage rather than the repository.

## Milestone/task simulations

Three current-workflow simulations and three pre-edit-snapshot comparisons
covered new plan outcomes with precise contracts and independent task mapping,
legacy partially completed plans without renumbering/repeating committed work,
and rejection of milestone completion when privacy/boundary evidence is failed
or unavailable. All nine assertions pass for each version after semantic
adjudication. These strongly prompted simulations show no comparative gain.
The new template and source checks enforce explicit milestone keys and
`Supports`/coverage fields; the previous model also reasoned correctly from
these scenarios without those explicit instructions.

The initial grader marked one assertion false in both versions solely because
"selected session model" was used instead of "premium coordinator". Independent
source/trace verification refuted that wording-based failure: model
preconditions were supplied as satisfied and verification remained with the
user-selected parent. No requirement or source behavior was weakened to alter
the score. Original and adjudicated grades remain in private temporary storage.

The snapshot preserves the pre-edit workflow files. Its unused behavior-spec
reference was not copied; no BDD scaffold or execution depended on it. These
results establish declared-outcome decisions, not live generated task-table
consistency, provider/model enforcement, real execution, or statistical
improvement. Timing, token usage, and realized cost were not measured.

## Auto-mode simulations

Three updated-workflow simulations and three pre-edit comparisons covered full
local continuation with decisions and safe commit-message recovery, blocked
user staging/unavailable boundary evidence, and new-invocation/per-diff consent.
Independent read-only grading produced these declared-outcome results:

| Case | With auto instructions | Pre-edit workflow |
| --- | --- | --- |
| Full plan, decision ledger, commit retry, residual docs | 3/3 | 0/3 |
| Unsafe user staging and unavailable required evidence | 3/3 | 3/3 |
| Explicit resume mode and fresh-per-diff authority | 3/3 | 2/3 |
| Total | 9/9 | 5/9 |

The snapshot comes from the verified pre-edit revision
`f3b6b410eee1faac9cab4afaf25e3d37e93ab49b`, including the original compiler,
executor, model policy, and commit procedure. The first continuation prompt
exposed only the chat decision index; it was revised to request simulated
`execution.md` entries too, then rerun for both versions. The pre-edit simulator
initially used `INCOMPLETE` for its policy-blocked plan; a same-model retry at
60 rather than 30 turns clarified simulation status without granting missing
consent. No turn-limit exhaustion was reported.

The current continuation trace includes every task commit, slice acceptance,
residual documentation, final audit, and bookkeeping. Its D001–D003 entries
include alternatives, rationale, impact, validation, and a complete review
index without claiming user approval. It retries the rejected commit message
once before dispatching Task 2, preserving hooks and fixed contracts. Both
versions preserve user work and required evidence in the blocker scenarios;
those strongly cued assertions do not demonstrate comparative improvement.

These are single-run, declared-outcome simulations, not live plan execution or
proof of durable file writes, actual staging/hooks, model telemetry, or provider
behavior. Simulator results and source-contract checks are complementary, not
runtime guarantees. Timing, token counts, realized cost, and detailed stop
reasons were not supplied; no performance or statistical claim is made. Outputs,
grades, snapshots, and the review viewer remain in private temporary storage.

A separate read-only source audit found no material contradiction across the
coordinator, auto policy, compiler/template, executor, adapters, model policy,
commit guidance, and README. Required fresh-per-diff approvals remain blockers;
`--auto` only supplies standing consent where applicable instructions accept it.
Scoped workflow Markdown lint and woke pass; README retains its pre-existing
MD028 warning at line 12. `make check-specs` and `git diff --check` pass.

## Review and limits

Premium source review caught a manual `next-slice` regression: the extracted
procedure originally required a compiled task document even in manual mode.
Manual plan-to-inline-TDD is restored; coordinated workers still require a
compiled task document.
Readiness/authorization mutation checks, manual-only invocation checks, and an
explicit residual-requirement route were added. Claude preflight also rejects
fallback chains that could switch the worker model. The shared steerability
guide remains unchanged. Premium task-commit source review found no material
defects; it examined authorization, task-only staging, interruption recovery,
real Git indexing, worker restrictions, and manual-path preservation. Premium
milestone-update review found no blocking regression or contradiction across
plan/compiler/executor/manual paths, legacy/flat/residual cases, and scope
constraints. Root GLOSSARY.md records the distinct slice/PDD milestone and
implementation-task terms; no existing project plan was migrated.

No live plan was implemented and no native Claude subagent was launched. The
simulations do not cover actual provider failures, higher-budget recovery,
Claude telemetry, or a successful unsliced-work loop. Claude execution can
pause when effective model/effort or fallback chains cannot be verified.
Pi execution requires the newly loaded no-fallback schema, not merely an
updated source checkout. Validate a real small plan after installation before
relying on unattended operation.
