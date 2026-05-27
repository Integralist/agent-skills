---
name: test-feedback
description: >-
  Parse test failure output and fix the failing tests in a
  background subagent. Use when the user shares test output or
  says "tests fail". Default output path is /tmp/output.
---

# Test Feedback

Spawn a background subagent to parse test failures and fix them.

## Arguments

The user may provide a file path to test output. Default:
`/tmp/output`

## Process

1. **Determine the output path.** Use whatever the user
   provided, or `/tmp/output` if not specified.

2. **Verify the file exists** by reading it. If it doesn't exist
   or is empty, ask the user where the output is. Do NOT spawn a
   subagent without valid test output.

3. **Spawn a background subagent.** Include in the subagent
   prompt:

   - The path to the test output file
   - Instruction to read the test output first
   - Instruction to parse and summarize failures before fixing
   - Instruction to read relevant source files before proposing
     fixes
   - Instruction to identify root causes — no guessing
   - Instruction to prefer fixing implementation over weakening
     test assertions
   - Instruction to run `make test` after fixing (up to 3
     iterations)
   - Instruction to update `docs/**/*.md` or `**/README.md`
     if the fix changes behavior, public APIs, or usage
     patterns
   - Instruction to NOT commit — leave that to the user
   - If the output contains `e2e` or integration test failures,
     note that `make test-integration` requires a running stack
   - The project's AGENTS.md path for conventions

4. **Return control** to the user immediately with a brief
   confirmation:

   ```txt
   Background subagent is parsing failures from /tmp/output and
   working on fixes. You'll be notified when it's done.
   ```

## REQUIRED

- You MUST spawn a background subagent for the fix work.
- You MUST verify the output file exists before spawning.
- You MUST NOT do the fix work yourself.
- You MUST NOT weaken assertions to make tests pass.
