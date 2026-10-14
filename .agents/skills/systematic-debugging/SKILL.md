---
name: systematic-debugging
description: >-
  Investigate bugs, failing tests, or unexpected behavior through root-cause
  analysis. Use when debugging issues or diagnosing test failures.
metadata:
  model-tier: complex
---

# Systematic Debugging

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

Never apply symptom-focused patches that mask underlying problems.
Understand WHY something fails before attempting to fix it.

## The Four-Phase Framework

### Phase 1: Root Cause Investigation

Before changing code:

1. **Read error messages thoroughly** — every word matters.
2. **Establish the failure** — record expected versus observed behavior;
   reproduce where possible and state any limits on verification.
3. **Examine recent changes** — what changed before this started failing?
4. **Gather diagnostic evidence** — logs, stack traces, state dumps.
   Separate observations from interpretations. Record each observation's
   source, timestamp, environment/version, and collection limits.
   Missing telemetry alone does not establish that an event never happened.
5. **Trace data flow** — use observed behavior to guide targeted source
   inspection. Source shows possible execution paths, not which path ran.
6. **Check for prior occurrences** — search organizational knowledge
   sources (Slack, Confluence, Jira) for the same error, a known issue,
   or a past incident. See
   [`../shared/KNOWLEDGE-SOURCES.md`](../shared/KNOWLEDGE-SOURCES.md).

For production investigations, collect evidence through authorized, bounded,
read-only queries. If access or telemetry is missing, state the gap and request
the specific evidence needed.

On a gnarly bug, delegate this evidence-gathering and prior-occurrence
search to a read-only diagnostic subagent. Ask it to report evidence,
contradictions, competing explanations, and missing evidence rather than
endorse a favored hypothesis. Keep its work
review-only; do not modify code or run tools that change state. Follow the
[shared subagent guidance](../shared/SUBAGENT-STEERABILITY.md), including its
completion and retry protocol. Phase 4 implementation stays in the main thread
so each fix is steerable.

**Root-cause tracing technique:**

```txt
1. Observe the symptom — where does the error manifest?
2. Find immediate cause — which code directly produces the error?
3. Ask "What called this?" — map the call chain upward
4. Keep tracing up — follow invalid data backward through the stack
5. Find original trigger — where did the problem actually start?
```

**Key principle:** never fix only where the error appears — always trace
to the original trigger.

### Phase 2: Pattern Analysis

1. **Identify a working control** — a comparable successful case.
2. **Compare conditions** — inputs, configuration, versions, load, timing,
   environment, and dependencies, not just implementations.
3. **Identify differences** — record uncontrolled differences that could
   explain the result before attributing causality.
4. **Inspect relevant code and dependencies** — explain the observed
   differences and identify assumptions to test.

### Phase 3: Hypothesis and Testing

Apply the scientific method:

1. **Select ONE hypothesis to test** — "the error occurs because X".
   Record plausible alternatives without testing them all at once.
2. **Define a falsifier** — what observation would disprove the hypothesis?
3. **Design a discriminating test** — change ONE variable. Predict results
   under the hypothesis and plausible alternatives before running it.
4. **Run the test** — execute and record the observed result.
5. **Check against the evidence** — reject or revise hypotheses that
   contradict reliable observations. Supporting evidence alone does not
   establish a unique cause.
6. **Iterate or proceed** — gather more evidence if the result is ambiguous;
   implement only when a discriminating test supports the proposed cause
   and no reliable observation contradicts it.

When no hypothesis fits, check evidence quality, name the unresolved question,
and collect the smallest signal that distinguishes explanations. Inspect
application, dependency, network, or OS boundaries as justified by that
question, rather than expanding unsupported guesses.

### Phase 4: Implementation

1. **Create a failing test case** — reproduce the reported behavior and
   confirm it fails on the intended assertion before the fix, not on setup
   or compilation. Check that fixtures and mocks do not assume the suspected
   cause. If reproduction is unavailable, report the verification gap before
   claiming a fix.
2. **Implement a single fix** — address root cause, not symptoms.
3. **Verify the same test passes** — keep its behavioral assertion intact.
4. **Run the full test suite** — ensure no regressions and recheck the
   working control.
5. **If the fix fails, STOP** — re-evaluate the hypothesis.

**Critical rule:** if THREE or more fixes fail consecutively, STOP. This
signals architectural problems requiring discussion, not more patches.

## Red Flags — Process Violations

Stop immediately if you catch yourself thinking:

- "Quick fix for now, investigate later"
- "One more fix attempt" (after multiple failures)
- "This should work" (without understanding why)
- "Let me just try..." (without a hypothesis)
- "It works on my machine" (without investigating the difference)

## Warning Signs of Deeper Problems

**Consecutive fixes revealing new problems in different areas** indicates
architectural issues:

- Stop patching.
- Document what you've found.
- Discuss with the team before proceeding.
- Consider whether the design needs rethinking.

## Common Debugging Scenarios

### Test Failures

```txt
1. Read the FULL error message and stack trace
2. Identify which assertion failed and why
3. Check test setup — is the test environment correct?
4. Check test data — are mocks/fixtures correct?
5. Trace to the source of the unexpected value
```

### Runtime Errors

```txt
1. Capture the full stack trace
2. Identify the line that throws
3. Check what values are undefined/null
4. Trace backward to find where the bad value originated
5. Add validation at the source
```

### "It worked before"

```txt
1. Use git bisect to find the breaking commit
2. Compare the change with the previous working version
3. Identify what assumption changed
4. Fix at the source of the assumption violation
```

### Intermittent Failures

```txt
1. Look for race conditions
2. Check for shared mutable state
3. Examine async operation ordering
4. Look for timing dependencies
5. Add deterministic waits or proper synchronization
```

## Debugging Checklist

Before claiming a bug is fixed:

- [ ] Root cause identified and documented
- [ ] Hypothesis formed and tested
- [ ] Fix addresses root cause, not symptoms
- [ ] Failing test created that reproduces the bug
- [ ] Test now passes with the fix
- [ ] Full test suite passes
- [ ] No "quick fix" rationalization used
- [ ] Fix is minimal and focused
- [ ] Documentation updated if behavior changed (`docs/**/*.md`,
  `**/README.md`)

## Success Metrics

Systematic debugging achieves ~95% first-time fix rate vs ~40% with
ad-hoc approaches.

Signs you're doing it right:

- Fixes don't create new bugs.
- You can explain WHY the bug occurred.
- Similar bugs don't recur.
- Code is better after the fix, not just "working".

## Integration with Other Skills

- **go-testing**: create a test that reproduces the bug before fixing.
- Halt debug spirals after 3 failures and state errors matter-of-factly — see
  [`../shared/EXECUTIVE-SCAFFOLDING.md`](../shared/EXECUTIVE-SCAFFOLDING.md).
