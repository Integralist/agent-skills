---
name: eval
description: >-
  Run a skill's eval cases in a sandbox and grade them against the previous
  run, drafting or refreshing the cases first. Use when the user wants to test
  a skill in this repo, add eval cases, or check a skill edit for regressions.
disable-model-invocation: true
argument-hint: "[skill-name]"
metadata:
  model-tier: moderate
---

Run a skill's fixed eval cases in isolated sandboxes and grade the results
against the previous run. Skills have no compiler: the evidence is realistic
prompts and transcript review. Cases and plain-English checks are versioned
with the skills.

## Paths

All paths are relative to the repository. Read the skill from the working tree,
not `~/.agents/skills/`, which lags until the next `make install-agents` and
would test the previous edit.

- `.agents/skills/<skill>/SKILL.md`: skill text under test.
- `.agents/skills/<skill>/evals/cases.json`: cases; see
  [CASES-FORMAT.md](references/CASES-FORMAT.md).
- `docs/evals/<yyyy-mm-dd>-<hhmm>-<skill>.md`: run result; see
  [RESULTS-FORMAT.md](references/RESULTS-FORMAT.md).

## Workflow

1. **Choose the skill.** Confirm `.agents/skills/` exists; if not, stop with
   a note. With no argument, list skills, flag those without cases, and ask
   which one. Do not continue until the target is named.
2. **Settle the cases.** If `evals/cases.json` is missing, draft a starter
   suite with one case per described branch and hard rule. Otherwise compare
   `git log -1 --format=%h -- <skill path>` with the Skill revision in the
   newest results file. If they differ, read the diff and propose cases for
   new behaviour and retirement of checks for removed behaviour. Derive cases
   from the skill; never edit a check because it went red—that would rewrite
   the test to match a bug. Show the cases diff and write it only after user
   approval. Cases do not change mid-run.
3. **Execute and grade.** When drafting or updating cases, read
   [CASES-FORMAT.md](references/CASES-FORMAT.md); before writing a run result,
   read [RESULTS-FORMAT.md](references/RESULTS-FORMAT.md). Before preparing
   cases or launching executors, read
   [RUN-PROTOCOL.md](references/RUN-PROTOCOL.md). It governs sandbox setup,
   cold execution, verification, transcript handling, grading, cleanup, and
   model/delegation rules. Each case must have a transcript or a recorded
   setup failure; each check needs a verdict and evidence.
4. **Report.** Run `mkdir -p docs/evals` and write a new result file stamped
   with `date +%F-%H%M`, compared with the newest older
   `docs/evals/*-<skill>.md` (names sort by time). Never overwrite an earlier run. Record skill and
   cases revisions using `git log -1 --format=%h -- <path>`; append `-dirty`
   when uncommitted. Mark a case whose `setup` or `prompt` changed as
   `revised`, not scored against history. List every check that passed last
   time but fails now before proposing a skill change; the user decides what
   to do about regressions. Include parent verification output and state the
   regressions.

## Growing the suite

A failure caught by hand becomes a case; that is useful growth. Change a check
only when intended behaviour changed. Keep a known, accepted trade-off as a
documented `fail`; do not chase a green board by deleting the signal.
