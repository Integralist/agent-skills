---
name: fix-failing-tests
description: >-
  Diagnose and fix test failures from saved test output. Use when the user
  shares test output or says "tests fail".
metadata:
  model-tier: moderate
---

# Fix Failing Tests

Find the failures in a test-output file, have a read-only subagent diagnose
their root causes, then apply the fixes in the main thread, where the user can
redirect or stop any fix before work piles up.

1. **Find the output.** Use the path the user gave, else `/tmp/output`. Read
   it; if it's missing or empty, ask the user where the output is. Done when
   you have a non-empty file.

2. **Search for failures.** Search for markers rather than reading, because
   failures slip past in long output mixed with passing lines and infra logs:

   ```bash
   rg -n 'FAIL|--- FAIL|^panic:|DATA RACE|^not ok|Error Trace|build failed' <path>
   ```

   If nothing matches, report "no failures found" with the command you ran,
   and stop. Done when you have the list of failures, or have reported none.

3. **Diagnose in a read-only subagent.** Follow the completion and retry
   rules in [the shared subagent policy](../shared/SUBAGENT-STEERABILITY.md).
   Tell the subagent to:
   - read the output file and the failures you found, then the relevant
     source, before reasoning about causes;
   - find the root cause from evidence, saying so when evidence is missing
     instead of guessing;
   - stay read-only: no edits, no `make test`, no workspace changes;
   - prefer fixing the implementation over weakening an assertion;
   - note any `docs/**/*.md` or `**/README.md` a fix would touch if it
     changes behaviour, public APIs, or usage;
   - note that `e2e` or integration failures need a running stack for
     `make test-integration`;
   - follow the project's AGENTS.md;
   - return, per failure, the test, the root cause, and the proposed fix.

   Done when every failure has a root cause and a proposed fix.

4. **Fix in the main thread.** Show the root causes and fixes, then apply
   them, flagging any you're unsure of so the user can redirect, skip, or
   stop. Never weaken an assertion to make a test pass. Update the docs a
   fix affects. Rerun the original failing cases with their required flags and
   environment, and run `make test` for regressions. Integration failures need
   `make test-integration` against a running stack. Reuse a passing run that
   covers both. If a fix doesn't hold, re-diagnose rather than guess. After
   3 runs that still fail, stop editing, name the assumption you haven't
   verified, and ask one diagnostic question. Leave committing to the user.
   Done when the original failing cases and regression checks pass, or you've
   stopped and reported what failed or couldn't be verified.
