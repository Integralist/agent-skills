---
name: is-it-safe
description: >-
  Find the worst credible consequence of committing or merging a code change.
  Use when the user asks whether the current branch, a commit or range, or a
  pull request is safe to commit or merge.
disable-model-invocation: true
argument-hint: "[PR URL | PR number | commit/range | base ref]"
metadata:
  model-tier: complex
---

Determine the worst credible consequence of committing or merging these exact
changes; trace one evidence-backed failure path. This is adversarial impact
analysis, not a code review or risk matrix.

**Read-only.** Change, approve, commit, push, or merge nothing; post a PR
comment only after approval in step 6. Judge reachability and consequence, not
style or maintainability. A test gap isn't proof of a defect; a passing suite
isn't proof of safety. State your evidence.

Read [INVESTIGATION.md](references/INVESTIGATION.md) for target resolution,
impact tracing, and disproof. Read [REPORT.md](references/REPORT.md) for
verdicts, report format, and PR-comment attribution.

1. **Start the clock.** Record `date +%s` now and just before reporting.
   Report elapsed time for every outcome, including `UNKNOWN` and “nothing
   pending.” If no reliable clock is available, say so; don't estimate.
2. **Resolve the target.** Follow INVESTIGATION.md for the supplied input.
   Keep committed and worktree changes distinct. If nothing is pending, say so
   and ask for a commit, range, or PR; never assume the latest commit.
3. **Trace the worst outcome.** Read the full diff, intent, and relevant
   callers, consumers, invariants, configuration, and deploy/rollback paths.
   Follow a concrete trigger → changed behaviour → affected system/users →
   consequence, including evidenced preconditions, blast radius, and
   safeguards. Drop unreachable speculation.
4. **Try to disprove it.** Check callers, validation, feature gates, tests, and
   safeguards. Run tests only in an evidenced disposable sandbox isolated from
   host files, credentials, and production. For material cross-module paths,
   use one independent read-only refuter as INVESTIGATION.md describes. Cite
   evidence; separate facts, assumptions, and unknowns. Stop when confirmed or
   refuted and decision-relevant unknowns are explicit.
5. **Report.** Follow REPORT.md, verdict first. Lead with the worst outcome;
   add another only if independently material. Keep unknowns separate.
6. **Offer a PR comment.** For a PR, ask “💬 Should I post a review comment to
   the PR?” Post nothing unless the user says yes. Then post one top-level
   comment, not inline, using REPORT.md's attribution and verdict sections;
   omit Model and Elapsed. If the PR can't be reached or posting fails, say so.
