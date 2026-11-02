---
name: security-review-feedback
description: >-
  Validate security review findings and vulnerability reports before fixing.
  Use when triaging security findings, vulnerability scanner output, or audit
  reports.
metadata:
  model-tier: complex
---

Validate each security finding before changing code. Give it one verdict—
`TRUE POSITIVE`, `FALSE POSITIVE`, or `NEEDS-INFO`—backed by evidence. Fix only
true positives. This skill adds the verdict step to the
[code-review-feedback](../code-review-feedback/SKILL.md) workflow; follow that
skill to respond and fix.

## Review each finding

1. **Restate the claim.** State the vulnerability, root cause, trigger, and
   claimed impact in your own words. If you cannot restate it, mark it
   `NEEDS-INFO` and ask the reviewer to identify the code path.
2. **Set the threat model.** Name the code's privilege and sandbox, what the
   attacker can already do, and whether the relevant input is attacker-
   controlled or trusted (for example, configuration, constants, or values
   set by a trusted component at setup).
3. **Trace source to sink.** Prove each hop from attacker data to the
   dangerous operation; do not assume data arrives unmodified. Trace back
   from the sink through every validation, bounds check, and assertion. Check
   claimed guards, including auth middleware and comments, against actual
   route registration. Cite the path and guards by file and line.
4. **Apply every relevant gate.** A finding is a `TRUE POSITIVE` only if all
   applicable gates pass. Its first failed gate makes it a `FALSE POSITIVE`.

   - **Reachability:** Pass if a concrete path reaches the code with attacker
     input. Fail if the path is unreachable, dead, or test/debug-only.
   - **Attacker control:** Pass if the attacker controls data that drives the
     bug. Fail if the input is internal, trusted, or fixed.
   - **Real impact:** Pass if it leads to code execution, privilege
     escalation, or a leak. Fail if it is only a robustness issue, such as a
     restartable crash.
   - **Math / bounds:** Pass if the condition is arithmetically possible
     after validation. Fail if validation makes it impossible, such as an
     underflow that cannot occur.
   - **Environment:** Pass if platform protections do not fully block
     exploitation. Fail if a sandbox, framework, or language guarantee
     blocks it entirely.

5. **Set verdict and severity.** Re-derive severity from impact times
   reachability rather than adopting the reviewer's rating. An unauthenticated,
   trivially reachable RCE is critical; the same bug behind three privilege
   checks is not, and improbable preconditions make severity `low`. Before a
   `FALSE POSITIVE` verdict, read
   [FALSE-POSITIVE-CHECKS.md](references/FALSE-POSITIVE-CHECKS.md) and support the
   rejection with evidence.
6. **Check chains.** Consider whether findings that failed individually can
   combine into a viable attack, such as an information leak that provides an
   address needed by a rejected overflow. A chain can be a `TRUE POSITIVE`
   even when its links are not.
7. **Fix true positives.** Fix them one at a time, highest severity first,
   following code-review-feedback. Test each fix. Reach a verdict before any
   fix, even when it looks cheap; verify each instance because callers and
   protections can differ.

Every finding must pass all applicable gates or fail a named one. Record one
line per finding, with evidence and the failed gate where applicable:

```txt
FINDING #1 TRUE POSITIVE — SQL injection reaches raw concat (db.go:88)
FINDING #2 FALSE POSITIVE — Bounds: length >= 16 prevents underflow (line 40)
FINDING #3 NEEDS-INFO — Can't identify middleware or route; ask for the path
```

## Read-only trace delegation

For a multi-module finding or several independent clusters, you may delegate
traces to read-only investigators under the
[shared subagent policy](../shared/SUBAGENT-STEERABILITY.md). Give each the
claim, threat model, revision, scoped paths, and relevant instructions; allow
only verified read-only tools—no edits, test runs, or remote writes. Require
`COMPLETE` or `INCOMPLETE`, checked paths, source-to-sink and guard citations,
counterevidence, and unknowns. Budget 40 turns and follow the policy's
completion and retry rules. Verify critical evidence yourself. Keep verdicts,
severity, chains, user discussion, and fixes in the main thread. If delegation
is unavailable, trace inline.
