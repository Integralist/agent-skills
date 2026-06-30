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

A read-only background subagent diagnoses test failures; the main
thread applies the fixes interactively so the user can redirect any
fix before work piles up. See
[`shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md)
for the rule this follows.

## Process

1. **Determine the output path** — what the user provided, else
   `/tmp/output`.

1. **Verify the file exists** by reading it. If missing or empty, ask
   the user where the output is. Do NOT spawn a subagent without valid
   test output.

1. **Spawn a read-only diagnosis subagent.** Its prompt must include:

   - The test-output file path; read it first, then parse and
     summarize the failures.
   - Read relevant source files before reasoning about causes.
   - Identify root causes — no guessing.
   - **Read-only**: do not edit files, run `make test`, or change the
     workspace. Diagnose and propose only.
   - Prefer fixing implementation over weakening test assertions, and
     say so in each proposed fix.
   - Note which `docs/**/*.md` or `**/README.md` the fix would touch
     if it changes behavior, public APIs, or usage patterns.
   - If the output has `e2e` or integration failures, note that
     `make test-integration` requires a running stack.
   - The project's AGENTS.md path for conventions.
   - Return per failure: the failing test, the root cause, the
     proposed fix.

1. **Apply the fixes interactively (main thread).**

   - Present the per-failure root causes and proposed fixes.
   - Apply them yourself, surfacing any you're unsure about so the
     user can redirect, skip, or stop mid-stream.
   - Prefer fixing implementation over weakening test assertions.
   - Run `make test` after applying (up to 3 iterations). If a fix
     doesn't hold, re-diagnose rather than guessing.
   - Update `docs/**/*.md` or `**/README.md` when a fix changes
     behavior, public APIs, or usage patterns.
   - Do NOT commit — leave that to the user.

## REQUIRED

- Verify the output file exists before spawning.
- The diagnosis subagent is read-only — it diagnoses, never edits.
- Apply fixes in the main thread so each stays steerable.
- Never weaken assertions to make tests pass.
