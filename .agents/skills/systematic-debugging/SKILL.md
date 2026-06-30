---
name: systematic-debugging
description: Four-phase debugging methodology with root cause analysis. Use when investigating bugs, fixing test failures, or troubleshooting unexpected behavior. Emphasizes NO FIXES WITHOUT ROOT CAUSE FIRST.
---

# Systematic Debugging

## Core Principle

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

Never apply symptom-focused patches that mask underlying problems.
Understand WHY something fails before attempting to fix it.

## The Four-Phase Framework

### Phase 1: Root Cause Investigation

Before touching any code:

1. **Read error messages thoroughly** — every word matters.
1. **Reproduce consistently** — you can't verify a fix you can't reproduce.
1. **Examine recent changes** — what changed before this started failing?
1. **Gather diagnostic evidence** — logs, stack traces, state dumps.
1. **Trace data flow** — follow the call chain to where bad values
   originate.

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

1. **Locate working examples** — similar code that works correctly.
1. **Compare implementations completely** — don't just skim.
1. **Identify differences** — what differs between working and broken?
1. **Understand dependencies** — what does this code depend on?

### Phase 3: Hypothesis and Testing

Apply the scientific method:

1. **Formulate ONE clear hypothesis** — "the error occurs because X".
1. **Design a minimal test** — change ONE variable at a time.
1. **Predict the outcome** — what happens if the hypothesis is correct?
1. **Run the test** — execute and observe.
1. **Verify results** — did it behave as predicted?
1. **Iterate or proceed** — refine if wrong, implement if right.

### Phase 4: Implementation

1. **Create a failing test case** — captures the bug behavior.
1. **Implement a single fix** — address root cause, not symptoms.
1. **Verify the test passes** — confirms the fix works.
1. **Run the full test suite** — ensure no regressions.
1. **If the fix fails, STOP** — re-evaluate the hypothesis.

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
