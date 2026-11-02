# Results format

`docs/evals/<yyyy-mm-dd>-<hhmm>-<skill>.md` — one file per run, committed so
the next run has something to compare against. The timestamp keeps same-day
runs from overwriting each other and makes the newest file the last one
alphabetically.

## Template

````md
# Eval: <skill> — <yyyy-mm-dd> <hh:mm>

- **Skill under test:** `.agents/skills/<skill>/SKILL.md`
- **Skill revision:** `<short-sha>` — suffix `-dirty` when uncommitted
- **Cases revision:** `<short-sha>` — suffix `-dirty` when uncommitted
- **Cases:** <n>
- **Result:** <passed>/<total> checks
- **Previous run:** `docs/evals/<yyyy-mm-dd>-<hhmm>-<skill>.md` (or `none`)

## Summary

| Case               | Score | vs previous      |
| ------------------ | ----- | ---------------- |
| single-file-fix    | 4/4   | 3/4              |
| nothing-to-commit  | 2/3   | 3/3 — REGRESSION |
| lockfile-with-code | 2/2   | new case         |

## Regressions

<Each check that passed previously and fails now, with both reasons. `None`
when the board held.>

## Failures

### <case-id>

- **<check text>** — <one-line reason citing the transcript>

## Transcripts

<Per case: commands run and final output, enough for a later reader to re-judge
a verdict without re-running the case.>
````

## Conventions

- Compare by `id`. A case absent from the previous run is `new case`; a case
  removed from `cases.json` drops out silently.
- Mark a case `revised` instead of scoring it against history when its `setup`
  or `prompt` changed since the previous run. The id stays the same while what
  it measures does not, so the old score is not a baseline — and a rewritten
  case scoring lower is not a regression.
- Record the revision of the `SKILL.md` actually read. The next run compares
  against it to decide whether the cases have drifted; a `-dirty` revision
  means the comparison is approximate.
- Keep each reason to what the transcript shows. "Ran `git push` after the
  commit" is re-checkable; "did not follow the skill" is not.
- Transcripts are why results are Markdown rather than a score file — a run
  you cannot re-read is a number you have to take on faith.
