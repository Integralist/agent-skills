---
name: systematic-debugging
description: >-
  Investigate bugs, failing tests, or unexpected behavior through root-cause
  analysis. Use when debugging issues or diagnosing test failures.
metadata:
  model-tier: moderate
---

Find why something fails before changing code, then fix the root cause with a
test that proves it. Work through the phases in order.

## Investigate

1. **Investigate.** Read the whole error and stack trace. Record expected
   versus observed behaviour, reproduce where possible, and say what you
   could not verify. Check what changed before the failure began. Gather logs,
   traces, and state; keep observations separate from interpretations, and
   record each source, time, environment or version, and collection limits.
   Missing telemetry does not prove an event did not happen. In production,
   use only authorized, bounded, read-only queries and name any evidence you
   lack. Let evidence guide which source you read: source shows paths that
   could run, not the path that did. Trace backward from the error through
   each caller to the original trigger. Search Slack, Confluence, and Jira
   for the error or a past incident, as
   [KNOWLEDGE-SOURCES.md](../shared/KNOWLEDGE-SOURCES.md) describes. Finish
   when you can name the trigger or the evidence needed to find it.
2. **Compare with a working case.** Compare a similar successful case across
   inputs, configuration, versions, load, timing, environment, and
   dependencies—not just code. List differences that could explain the result
   before blaming any one of them. Finish when you have the differences and
   assumptions to test.

## Test a cause, then fix it

1. **Test one hypothesis.** State it as “it fails because X,” note the
   alternatives, and name an observation that would disprove it. Change one
   variable, predict the result under each explanation, then run the test.
   Drop or revise a hypothesis contradicted by a reliable observation;
   supporting evidence alone does not make a cause unique. If nothing fits,
   check evidence quality, state the open question, and collect the smallest
   signal that distinguishes the explanations. Finish when a discriminating
   test supports one cause and nothing reliable contradicts it.
2. **Fix the root cause.** Write a test that reproduces the bug and fails on
   its assertion, not on setup or compilation. Check that fixtures and mocks
   do not assume the cause. If you cannot reproduce the bug, report that gap
   before claiming a fix. Make one fix, keep the test assertion intact, run
   the full suite, and recheck the working case. Update `docs/**/*.md` or
   `**/README.md` if behaviour changed. If the fix fails, return to the
   hypothesis step.
   Finish when the test and suite pass and you can explain why the bug
   happened.

## Stop conditions and special cases

**Three strikes.** After three failed fixes in a row, or fixes that keep
surfacing new problems elsewhere, stop patching. Write up what you found and
discuss the design with the user before continuing.

**Common cases.** For “it worked before,” use `git bisect` to find the
breaking commit and the assumption it changed. For intermittent failures,
look for races, shared mutable state, and async ordering before adding waits
or retries.

**Reporting.** State errors plainly: where, what you saw, and what you
expected. If the cause is unproven, name the missing evidence rather than
offering a guess.

**Evidence delegation.** On a hard bug, you may delegate step 1's evidence
gathering and history search to a read-only subagent under the
[shared subagent policy](../shared/SUBAGENT-STEERABILITY.md), following its
completion and retry rules. Ask for evidence, contradictions, competing
explanations, and gaps—not a verdict on a preferred hypothesis. Allow no
edits or state-changing tools. Keep the fix in the main thread so it stays
steerable.
