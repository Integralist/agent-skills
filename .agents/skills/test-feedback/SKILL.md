---
name: test-feedback
description: >-
  Parse test failure output and diagnose root causes in a
  read-only background subagent, then fix the failures
  interactively in the main thread. Use when the user shares
  test output or says "tests fail". Default output path is
  /tmp/output.
---

# Test Feedback

Diagnose test failures in a read-only background subagent, then
apply the fixes in the main thread where the user can steer them.

The subagent only reads and reasons — it parses the failures,
reads the relevant source, and returns a root-cause diagnosis
with a proposed fix per failure. It edits nothing. The main
thread then applies the fixes interactively, so the user can
redirect a fix they disagree with before work piles up. See
[`shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md)
for the general rule this follows.

## Arguments

The user may provide a file path to test output. Default:
`/tmp/output`

## Process

1. **Determine the output path.** Use whatever the user
   provided, or `/tmp/output` if not specified.

1. **Verify the file exists** by reading it. If it doesn't exist
   or is empty, ask the user where the output is. Do NOT spawn a
   subagent without valid test output.

1. **Spawn a read-only diagnosis subagent.** Include in the
   subagent prompt:

   - The path to the test output file
   - Instruction to read the test output first
   - Instruction to parse and summarize the failures
   - Instruction to read relevant source files before reasoning
     about causes
   - Instruction to identify root causes — no guessing
   - Instruction that this is **read-only**: do not edit files,
     run `make test`, or change the workspace. Diagnose and
     propose only.
   - Instruction to prefer fixing implementation over weakening
     test assertions, and to say so in each proposed fix
   - Instruction to note which `docs/**/*.md` or `**/README.md`
     the fix would touch if it changes behavior, public APIs, or
     usage patterns
   - If the output contains `e2e` or integration test failures,
     note that `make test-integration` requires a running stack
   - The project's AGENTS.md path for conventions
   - Instruction to return, per failure: the failing test, the
     root cause, and the proposed fix

1. **Apply the fixes interactively (main thread).** When the
   subagent returns its diagnosis:

   - Present the per-failure root causes and proposed fixes.
   - Apply the fixes yourself, surfacing any you're unsure about
     so the user can redirect, skip, or stop mid-stream.
   - Prefer fixing implementation over weakening test
     assertions.
   - Run `make test` after applying (up to 3 iterations). If a
     fix doesn't hold, re-diagnose rather than guessing.
   - Update `docs/**/*.md` or `**/README.md` when a fix changes
     behavior, public APIs, or usage patterns.
   - Do NOT commit — leave that to the user.

## REQUIRED

- You MUST verify the output file exists before spawning.
- The diagnosis subagent MUST be read-only — it diagnoses, it
  does not edit.
- You MUST apply the fixes in the main thread so each stays
  steerable.
- You MUST NOT weaken assertions to make tests pass.
