---
name: security-review-feedback
description: Use when receiving a security review or vulnerability report — from an AI tool, a security-review command, or a human reviewer — and deciding which findings are real and worth fixing. Verify reachability, attacker control, and exploitability before implementing any fix; reject false positives and severity inflation rather than agreeing reflexively.
---

# Security Review Reception

A security finding is a **claim to verify**, not an order to implement.

**Core principle:** every finding earns a **verdict** before any fix is written
— `TRUE POSITIVE`, `FALSE POSITIVE`, or `NEEDS-INFO`. Prove reachability and
impact with evidence; never assume them from how the code looks.

Security reviews — AI, command-driven, or human — fail the same way: **false
positives and severity inflation**. AI reviewers especially over-flag ("this
pattern looks dangerous") and overrate severity ("definitely critical") without
tracing whether an attacker can reach or control the code. Implementing every
flagged item churns code for issues that are unreachable or impossible.

## Relationship to `code-review-feedback`

The reception *posture* is shared, not restated here. Load
`code-review-feedback` for it: no performative agreement ("you're absolutely
right"), no gratitude, push back with technical reasoning, clarify unclear items
first, implement one at a time and test each.

This skill adds the **security verdict** layer on top: before the implement
stage, every finding passes the verdict workflow.

## The Verdict Workflow

```txt
FOR each finding in the review:
  1. RESTATE   the claim in your own words
  2. THREAT    establish the threat model
  3. TRACE     source → sink, and backwards for validation
  4. GATE      run the gate reviews
  5. VERDICT   assign verdict + calibrate severity
THEN:
  6. CHAIN     check whether rejected findings combine
  7. IMPLEMENT TRUE POSITIVEs only, highest severity first
```

### 1. Restate the claim

State the vulnerability, alleged root cause, trigger, and claimed impact in your
own words. Half of false positives collapse here — the claim doesn't cohere when
stated precisely. If you can't restate it coherently, verdict is `NEEDS-INFO`:
ask the reviewer rather than guessing.

### 2. Establish the threat model

- What privilege level does this code run at? Is it sandboxed?
- What can the attacker already do *before* triggering the bug?
- Is the input attacker-controlled, or internal/trusted (config, compile-time
  constant, value set by a trusted component)?

A "vulnerability" reachable only by an already-root local user, or fed only by
trusted internal data, rarely survives this step.

### 3. Trace source → sink

Confirm attacker-controlled data actually reaches the dangerous operation. Trace
the full path step by step — don't assume network/user data arrives unmodified.
Then trace **backwards**: find every validation, bounds check, and assertion
preceding the sink. Vulnerable-looking code is often guarded upstream. Verify
claimed guards (auth middleware, a "behind requireAdmin" comment) against the
actual registration — don't trust the claim.

### 4. Run the gate reviews

A finding is a `TRUE POSITIVE` only if it passes **every applicable** gate. The
first gate it fails makes it a `FALSE POSITIVE`, recorded with the evidence.

| Gate                 | Passes when                                                                 | Fails when                                                                       |
| -------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Reachability**     | A concrete execution path reaches the code under attacker-influenced inputs | The path is unreachable, dead, or test/debug-only                                |
| **Attacker control** | The attacker controls the data that drives the bug                          | The input is internal, trusted, or fixed                                         |
| **Real impact**      | Leads to RCE, privilege escalation, or information disclosure               | Only an operational-robustness issue (a crash of non-critical, restartable work) |
| **Math / bounds**    | The vulnerable condition is arithmetically possible given the validation    | Validation makes the condition impossible (e.g. underflow can't occur)           |
| **Environment**      | Platform/runtime protections do not fully prevent exploitation              | A sandbox, framework, or language guarantee blocks it entirely                   |

### 5. Assign a verdict + calibrate severity

Don't adopt the reviewer's severity uncritically — re-derive it from **impact ×
reachability**. An unauthenticated, trivially reachable RCE is critical; the
same bug behind three privilege checks is not. AI reviewers systematically
over-rate; a finding that survives the gates but needs improbable preconditions
is `low`, not `critical`.

## Rationalizations to Reject

If you catch yourself thinking any of these, STOP.

| Rationalization                                | Why it's wrong                                          | Required action                                     |
| ---------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
| "This pattern looks dangerous, so it's a vuln" | Pattern recognition is not analysis                     | Trace the data flow before concluding               |
| "This is clearly critical"                     | AI reviewers are biased toward bugs and over-rate them  | Prove impact and reachability with evidence         |
| "Similar code was vulnerable elsewhere"        | Each context has different callers and protections      | Verify *this* instance independently                |
| "Skip the trace, the fix is cheap anyway"      | Cheap fixes still churn code and can mask the real path | Run the full workflow; a no-op fix is still a no-op |
| "The reviewer is an expert, just implement"    | Source authority does not establish a finding's truth   | Verdict before fix, regardless of source            |

## Verdict Output Format

One line per finding, then act only on the confirmed set:

```txt
FINDING #1 TRUE POSITIVE  — SQL injection in search handler; user query reaches raw concat (sink: db.go:88)
FINDING #2 FALSE POSITIVE — Integer underflow in parser: Math/bounds gate fails — length validated >= 16 at line 40, so (length - 8) cannot underflow
FINDING #3 NEEDS-INFO     — "auth bypass in middleware": cannot identify which middleware or which route; ask reviewer to point at the code path
```

Then implement `TRUE POSITIVE`s only, highest severity first, one at a time —
the *how* of responding and fixing lives in `code-review-feedback`.

## Exploit Chains

After per-finding verdicts, check whether findings that individually failed a
gate combine into a viable attack — e.g. an info-disclosure that leaks the
address a separately-rejected overflow needs. A chain can be a `TRUE POSITIVE`
even when its links are not.

## Before Issuing a FALSE POSITIVE

Apply the full checklist in
[`false-positive-patterns.md`](false-positive-patterns.md) before finalizing any
`FALSE POSITIVE` verdict. A rejection is a claim too, and must be evidenced.

## The Bottom Line

**A security review = claims to verify, not fixes to apply.**

Verdict before fix. Evidence over pattern-matching. Re-derive severity. No
reflexive agreement, whatever the source.
