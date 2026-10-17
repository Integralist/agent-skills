---
name: security-review-feedback
description: >-
  Validate security review findings and vulnerability reports before fixing.
  Use when triaging security findings, vulnerability scanner output, or audit
  reports.
metadata:
  model-tier: complex
---

# Security Review Feedback

Give every security finding a verdict — `TRUE POSITIVE`, `FALSE POSITIVE`, or
`NEEDS-INFO` — backed by evidence, then fix only the true positives. Security
reviews, whether from AI, a scanner, or a person, fail the same way: they flag
code that looks dangerous without tracing whether an attacker can reach or
control it, and they inflate severity. Fixing every flagged item churns code
for impossible bugs. For how to respond and fix, follow the
code-review-feedback skill; this skill adds the verdict before that.

Work through each finding:

1. **Restate the claim.** State the vulnerability, root cause, trigger, and
   claimed impact in your own words. Many false positives collapse here,
   because the claim doesn't hold together once stated precisely. If you can't
   restate it, the verdict is `NEEDS-INFO`: ask the reviewer to point at the
   code path. Done when the claim is restated or marked `NEEDS-INFO`.

2. **Set the threat model.** What privilege does the code run at, and is it
   sandboxed? What can the attacker already do before triggering the bug? Is
   the input attacker-controlled, or trusted (config, constants, values set by
   a trusted component at setup)? A bug reachable only by local root or fed
   only trusted data rarely survives. Done when attacker and input trust are
   named.

3. **Trace source to sink.** Prove each hop from attacker data to the
   dangerous operation; don't assume data arrives unmodified. Then trace
   backwards for every validation, bounds check, and assertion before the
   sink, since vulnerable-looking code is often guarded upstream. Check
   claimed guards (auth middleware, a "behind requireAdmin" comment) against
   the actual route registration. Done when the path and its guards are cited
   by file and line.

4. **Run the gates.** A finding is a `TRUE POSITIVE` only if it passes every
   applicable gate. The first gate it fails makes it a `FALSE POSITIVE`.

   | Gate             | Passes when                                                 | Fails when                                                     |
   | ---------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
   | Reachability     | A concrete path reaches the code with attacker input        | The path is unreachable, dead, or test/debug-only              |
   | Attacker control | The attacker controls the data that drives the bug          | The input is internal, trusted, or fixed                       |
   | Real impact      | It leads to code execution, privilege escalation, or a leak | It's only a robustness issue, such as a restartable crash      |
   | Math / bounds    | The condition is arithmetically possible after validation   | Validation makes it impossible, e.g. underflow can't occur     |
   | Environment      | Platform protections don't fully block exploitation         | A sandbox, framework, or language guarantee blocks it entirely |

   Done when each finding has passed every gate or failed a named one.

5. **Set the verdict and severity.** Re-derive severity from impact times
   reachability rather than adopting the reviewer's. An unauthenticated,
   trivially reachable RCE is critical; the same bug behind three privilege
   checks is not, and one that needs improbable preconditions is `low`. Done
   when each finding has one line in this format:

   ```txt
   FINDING #1 TRUE POSITIVE  — SQL injection in search handler; user query reaches raw concat (sink: db.go:88)
   FINDING #2 FALSE POSITIVE — Integer underflow in parser: Math/bounds gate fails — length validated >= 16 at line 40, so (length - 8) cannot underflow
   FINDING #3 NEEDS-INFO     — "auth bypass in middleware": cannot identify which middleware or route; ask reviewer to point at the code path
   ```

Then:

6. **Check chains.** See whether findings that each failed a gate combine into
   a viable attack, such as an info leak that gives a rejected overflow the
   address it needs. A chain can be a `TRUE POSITIVE` when its links are not.
   Done when every combination of rejected findings has been considered.

7. **Fix the true positives.** Highest severity first, one at a time, as the
   code-review-feedback skill describes. Done when every `TRUE POSITIVE` is
   fixed and tested.

**Before a FALSE POSITIVE.** A rejection is a claim too, so evidence it. Check
the ways a finding can look real but be impossible:

- Conditional flow: `buf[length-4]` is safe if the path only runs when
  `length > 12`.
- Defensive code: a check followed by a guarded operation is defence; confirm
  the check actually prevents the condition.
- Bounds arithmetic: if `size >= MIN` and `MIN >= header`, then
  `size - header` can't underflow.
- TOCTOU: the checked value must be able to change before use.
- Concurrency: no race exists in single-threaded setup or under a held lock.
- API contract: some APIs bound their own writes or manage their own memory.
- Defence in depth: a failed secondary layer isn't critical while a primary
  control holds, e.g. token cleanup failing when tokens are single-use.

**Tempting shortcuts.** Verify each instance, even when similar code was
vulnerable elsewhere, since callers and protections differ. Run the full
workflow even when the fix looks cheap; a fix for an impossible bug still
churns code. Reach a verdict before any fix, whoever the reviewer is.

**Read-only trace checks.** For a multi-module finding or several independent
clusters of findings, you may hand traces to read-only investigators under
[the shared subagent policy](../shared/SUBAGENT-STEERABILITY.md). Give each one
the claim, threat model, revision, scoped paths, and relevant instructions,
and only verified read-only tools: no edits, test runs, or remote writes.
Require `COMPLETE` or `INCOMPLETE`, the paths checked, source-to-sink and guard
citations, counterevidence, and unknowns. Budget 40 turns and follow the
policy's completion and retry rules. Check critical evidence yourself, and
keep verdicts, severity, chains, user discussion, and fixes in the main
thread. If delegation isn't available, say so and trace inline.
