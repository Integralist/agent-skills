---
name: systematic-debugging
description: >-
  Investigate bugs, failing tests, or unexpected behavior through root-cause
  analysis. Use when debugging issues or diagnosing test failures.
metadata:
  model-tier: complex
---

# Systematic Debugging

Find why something fails before changing any code, then fix the root cause
with a test that proves it. A patch on the symptom hides the bug and costs
more later. Work through the phases in order.

1. **Investigate.** Read the whole error and stack trace. Record expected
   versus observed behaviour, reproduce it where you can, and say what you
   couldn't verify. Check what changed before it started failing. Gather
   logs, traces, and state, keeping observations apart from
   interpretations, and note each one's source, time, environment or
   version, and collection limits; missing telemetry doesn't prove an event
   didn't happen. In production, use only authorized, bounded, read-only
   queries, and name any evidence you lack. Let the evidence guide which
   source you read, since source shows paths that could run, not the one
   that did. Trace backwards from where the error appears, through each
   caller, to the original trigger. Search Slack, Confluence, and Jira for
   the same error or a past incident, as
   [KNOWLEDGE-SOURCES.md](../shared/KNOWLEDGE-SOURCES.md) describes. Done
   when you can name the trigger, or the evidence you'd need to find it.

2. **Compare with a working case.** Find a similar case that succeeds, and
   compare inputs, configuration, versions, load, timing, environment, and
   dependencies, not just code. List the differences that could explain the
   result before blaming any one of them. Done when you have the
   differences and the assumptions to test.

3. **Test one hypothesis.** State it as "it fails because X", and note the
   alternatives. Name the observation that would disprove it. Change one
   variable, predict the result under each explanation, then run it. Drop or
   revise any hypothesis a reliable observation contradicts; support alone
   doesn't make a cause unique. If nothing fits, check the evidence quality,
   name the open question, and collect the smallest signal that tells the
   explanations apart. Done when a discriminating test supports one cause
   and nothing reliable contradicts it.

4. **Fix it.** Write a test that reproduces the bug and fails on its
   assertion, not on setup or compilation, and check its fixtures and mocks
   don't assume the cause. If you can't reproduce it, report that gap before
   claiming a fix. Make one fix at the root cause, keep the test's assertion
   intact, then run the full suite and recheck the working case. Update
   `docs/**/*.md` or `**/README.md` if behaviour changed. If the fix fails,
   go back to step 3. Done when the test and suite pass and you can explain
   why the bug happened.

**Three strikes.** After three failed fixes in a row, or fixes that keep
surfacing new problems elsewhere, stop patching. Write up what you've found
and discuss the design with the user before going further.

**Common cases.** For "it worked before", use `git bisect` to find the
breaking commit and the assumption it changed. For intermittent failures,
look for races, shared mutable state, and async ordering before adding
waits or retries.

**Reporting.** State errors plainly: where, what you saw, what you expected.
If the cause isn't proven, say what evidence is missing rather than offer a
guess.

**Delegating evidence.** On a hard bug, you may hand step 1's evidence
gathering and history search to a read-only subagent, under
[the shared subagent policy](../shared/SUBAGENT-STEERABILITY.md) and its
completion and retry rules. Ask it for evidence, contradictions, competing
explanations, and gaps, not a verdict on your favourite hypothesis, and
allow no edits or state-changing tools. Keep step 4 in the main thread so
each fix stays steerable.
