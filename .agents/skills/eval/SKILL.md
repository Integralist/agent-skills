---
name: eval
description: >-
  Draft or refresh a skill's eval cases, then run them in a sandbox and grade
  the result against the previous run.
disable-model-invocation: true
argument-hint: "[skill-name]"
---

# Eval

Skills have no compiler — the only evidence one works is running it against
realistic prompts and reading what happened. This makes that a regression
suite: fixed cases, plain-English checks, graded from the transcript.

Scoped to this repo. Cases and results are versioned alongside the skills they
test.

## Scope

Confirm `.agents/skills/` exists in the current directory before anything else;
when it does not, report that and stop. Every path here is repo-relative.

| Path                                      | Role                                                         |
| ----------------------------------------- | ------------------------------------------------------------ |
| `.agents/skills/<skill>/SKILL.md`         | The text under test                                          |
| `.agents/skills/<skill>/evals/cases.json` | The cases — [`CASES-FORMAT.md`](CASES-FORMAT.md)             |
| `docs/evals/<yyyy-mm-dd>-<skill>.md`      | This run's result — [`RESULTS-FORMAT.md`](RESULTS-FORMAT.md) |

Read the target from the working tree. The installed copy under
`~/.agents/skills/` lags the repo until the next `make install-agents`, so
grading it scores the previous edit rather than the one you just made.

## Input

| Argument    | Scope                                                 |
| ----------- | ----------------------------------------------------- |
| Skill name  | Eval that skill                                       |
| No argument | List the skills and ask which, flagging those with no cases yet |

## Sync the cases

Cases must cover the skill as it stands now. Two states to settle before
running:

- **No `evals/cases.json`** — draft a starter suite from the target
  `SKILL.md`: one case per branch the skill describes, one per hard rule it
  states.
- **Drift** — compare `git log -1 --format=%h -- <skill path>` against the
  **Skill revision** recorded in the previous results file. When they differ,
  read that diff: propose a case or check for behaviour the skill now describes
  and nothing covers, and retirement for a check asserting behaviour the skill
  dropped.

Derive every case from the skill's text. A failing check is evidence about the
skill, not about the check — editing one in response to a red result rewrites
the test to match the bug, and the suite stops being able to tell you anything.

Show the proposed `cases.json` diff and get approval before writing it. Run
only once the file is settled; cases must not move mid-run.

## Sandbox

Each case with a `setup` runs in its own disposable directory under
`.evals-sandbox/<case-id>/` — inside the repo, and gitignored.

The executor subagent builds its own sandbox and runs `setup` itself, as its
first act, before touching the case prompt. The orchestrating thread only
dispatches and grades — it may lack permission to create or write a repository
outside the project, and a blocked write there can stall with no error rather
than fail.

Give the executor these three steps verbatim:

1. `rm -rf .evals-sandbox/<id> && mkdir -p .evals-sandbox/<id>`, then work only
   inside it.
1. Run the case's `setup` commands there, in order, exporting
   `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null` — global config
   otherwise bleeds ANSI colour into the transcript the grader reads, and makes
   a result depend on the machine that produced it.
1. Report a setup failure and stop, rather than running the prompt against a
   half-built sandbox.

The orchestrator removes the directory after grading; an in-project path keeps
that cleanup working even where writes elsewhere are refused.

Bound every setup command. A command that exceeds its bound records the case as
`hung`, naming the command that blocked — a distinct outcome from `fail`,
because it says nothing about the skill.

When a `setup` command fails, mark every check of that case `fail` with reason
`setup failed: <error>`, clean up, and move on — a half-built sandbox grades
the setup, not the skill.

When a case sets `keep_sandbox_on_fail` and a check fails, leave the directory
and print its path so the state can be inspected. Remove it by hand once done.

A case with no `setup` runs in the current directory. Reserve that for skills
that only read.

> [!WARNING]
> The sandbox isolates the repository under test — not `$HOME`, and not the
> filesystem. A skill reading a dotfile (`commit` reads `~/.gitcommit`) still
> reads your real one, so a check on that behaviour grades your home
> directory; plant the convention inside the sandbox instead. A skill writing
> a temp file outside the sandbox (`commit` writes its message there by
> design) is behaving correctly, not escaping.

## Run each case cold

**Cold** — the agent executing a case never sees that case's `checks`. An
executor that knows the criteria performs to them, and the run stops measuring
what the skill elicits on its own.

Dispatch one subagent per case, giving it only:

- the sandbox path, as its working directory
- the case `setup` commands, to run first
- the case `prompt`
- the target `SKILL.md`, read verbatim from the working tree
- an instruction to execute what the skill describes — real commands, real
  files, no simulation
- the transcript path, and the rule below

Cases run concurrently. Each owns a separate sandbox, so there is no shared
state to serialise on.

**The transcript is a file, not a reply.** The executor appends to
`.evals-sandbox/<id>-transcript.md` as it works — every command with its
output, then the final state — and the orchestrator grades from that file.
Executors routinely finish their work and go idle without answering, and no
wording in the dispatch prevents it; a run that depends on the reply loses its
evidence and has to score verified behaviour as unverified. Disk survives an
idle agent.

The transcript is a **sibling** of the sandbox, never inside it. A file within
the case repository shows up in `git status`, and a skill under test may then
stage the record of its own execution.

Read the transcript after each executor finishes, whatever it did or did not
say. Ask for a reply only to fill a gap the file leaves.

The executor inherits the session model. Evals run on the model you actually
use; a cheaper tier grades a skill you are not running.

Delegating this is safe despite the executor editing files: every edit lands in
a disposable sandbox, so there is no diff to unwind and nothing to steer
mid-flight. That is the sandboxed exception to
[`../shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md), not
a loosening of it.

Done when every case in `cases.json` has a transcript file on disk.

Copy each transcript somewhere durable before cleanup — the sandbox goes away
after grading, and the transcript is the run's only evidence.

## Grade

Read a case's `checks` only after its transcript is recorded.

Give each check `pass` or `fail` plus a one-line reason citing what in the
transcript decided it. Mark `fail` whenever the evidence for a pass is
absent — ambiguous is fail, and a check too vague to decide is itself the
finding.

Done when every check of every case carries a verdict and a reason.

## Report

`mkdir -p docs/evals`, then write `docs/evals/<yyyy-mm-dd>-<hhmm>-<skill>.md`,
stamped from `date +%F-%H%M`. Compare against the newest older file matching
`docs/evals/*-<skill>.md`; the names sort chronologically, so the newest is the
last. Every run keeps its own file — a re-run that overwrites its predecessor
destroys the baseline it exists to be compared against.

Record the revision of both the skill and `cases.json`, from `git log -1
--format=%h -- <path>`. A case whose `setup` or `prompt` changed since the
previous run is reported as `revised` rather than scored against history —
the id survives a rewrite, so without this a rebuilt case reads as a
regression.

State every check that passed in the previous run and fails in this one before
proposing any change to the skill. The regression is the result; what to do
about it is the user's call.

## Growing the suite

- A failure you caught by hand becomes a case. That is the growth path worth
  having.
- Change a `check` when the skill's intended behaviour deliberately changed.
- A known, accepted trade-off stays a documented `fail`. Chasing a green board
  deletes the checks that were telling you something.
