# Eval Run Protocol

Read this before preparing or launching eval cases.

1. **Run each case cold** in its own subagent. First, the parent prepares
   each sandbox using the rules below. Launch an executor only after setup
   succeeds and the sandbox location is verified. Record setup failures
   without launching an executor for that case.
   Cold means the executor never sees that case's checks or independent
   verification commands. Give it only the prepared sandbox's absolute path,
   the case's `prompt`, the target `SKILL.md` verbatim, the transcript path,
   and these steps verbatim. Resolve referenced skill guidance from this
   repo's working tree; keep the full case definitions out of its context:

   ```txt
   1. Start every shell invocation with a guarded change to the assigned
      absolute sandbox path, in that same shell. If it fails, stop.
   2. Execute the task using the provided skill; keep edits in the sandbox
      and record commands, output, exit codes, and final state in the
      assigned sibling transcript. The parent has already run setup.
   3. If a command runs outside the sandbox, stop and report it. Leave
      recovery of the parent repository to the parent agent.
   ```

   Done when every case has a transcript or a recorded setup failure.
2. **Grade** only after a transcript or setup-failure record exists. For a
   completed execution, the parent runs the case's optional `verify` commands
   in the finished sandbox, with a timeout per command, before cleanup.
   Capture commands, exit codes, and output separately from the executor's
   transcript. Failed, timed-out,
   or unrun verification prevents a passing case; never ask the executor to
   repair its output after seeing these checks. Use this evidence and the
   transcript for `pass` or `fail` per check, with a cited reason. Missing
   evidence is a fail, and a check too vague to decide is itself the finding.
   For several cases or long transcripts, use fresh read-only graders under
   [SUBAGENT-STEERABILITY.md](../../shared/SUBAGENT-STEERABILITY.md): give each
   a batch of finished case IDs, their fixed checks, independent verification
   output, and transcript paths (no executor self-grades), only verified
   read-only tools, and a 30-turn
   budget, and require `COMPLETE` or `INCOMPLETE` with every check's verdict,
   transcript location, and evidence. An incomplete grader isn't a finished
   pass. Verify cited claims and settle gaps or disagreements yourself; keep a
   short single case inline, and if delegation isn't available, say so and
   grade inline. Done when every check has a verdict and a reason.

## Sandbox

**Where.** The parent creates a fresh directory under `.evals-sandbox/`
for each case with `setup`; preserve existing runs rather than deleting them.
Resolve its absolute physical path and confirm it is inside that directory,
not the repository root. Run setup and verification in bounded shells whose
first commands enter and verify that path. Keep the directory change in that
shell, not a command substitution or logging helper's subshell. Export
`GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null` during setup.
For Git fixtures, verify that Git resolves to the sandbox before any Git
operation other than initialization. Stop if it resolves to the parent
repository. Record setup commands, exit codes, and output beside the sandbox;
stop on any failure.

The transcript sits beside the sandbox, never in it, so a skill under test
cannot stage its own record. A case without `setup` runs in the current
directory; reserve that for skills that only read.

**Transcripts are files.** Executors often finish and go idle without
replying, so grade from the transcript file, whatever the executor said, and
ask for a reply only to fill a gap. Copy each transcript somewhere durable
before cleanup, since it's the run's only evidence.

**Failures.** Bound every setup command; one that exceeds its bound records
the case as `hung`, naming the command, which says nothing about the skill. A
failed setup marks every check of that case `fail` with
`setup failed: <error>`. After grading, remove the sandbox, unless the case
sets `keep_sandbox_on_fail` and a check failed: then leave it, print its path,
and let the user remove it.

**Model and delegation.** The executor inherits the session model, so evals
measure the model you actually use. Executors may edit files because every
edit lands in a disposable sandbox, the sandboxed exception to
[SUBAGENT-STEERABILITY.md](../../shared/SUBAGENT-STEERABILITY.md); follow its
completion and retry protocol, retrying in a clean sandbox.

> [!WARNING]
> These directories do not enforce filesystem isolation. Executors can still
> access the parent repository and `$HOME`; sandbox checks reduce accidental
> writes but are not a security boundary. Plant needed dotfiles in the fixture.
> Allow only explicitly approved external writes, such as a skill's temp file.
