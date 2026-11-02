# Verdicts and report

## Verdicts

Choose by evidence; use no score or impact matrix. Keep the colored marker
beside each verdict:

- 🟢 **PROCEED:** no concrete material failure path in the inspected scope;
  not a guarantee of no risk.
- 🟡 **HOLD:** a credible material risk needs mitigation or an explicit
  decision, but no release-blocking outcome is established.
- 🔴 **STOP:** evidence establishes a severe, release-blocking consequence
  with no effective safeguard; recommend against commit/merge until fixed.
- ⚪ **UNKNOWN:** the target, source, or critical behaviour couldn't be assessed
  reliably. Name missing access/evidence; claim neither safe nor unsafe.

## Report

Keep it short. Use [voice-product](../../voice-product/SKILL.md): plain language
for a human who may act. Name who does what, under which condition, with what
observable impact. Keep the causal path, preconditions, `path:line` evidence,
uncertainty, and mitigation. Lead with the worst outcome; add another only if
independently material. Don't pad PROCEED with generic risks.

```txt
BAD:  Contributor-controlled test code could expose credentials.
GOOD: If we run the PR's test without isolation, its code runs on the test
      machine. It could read credentials there or change files that account
      can reach. Run only in an isolated environment without credentials;
      otherwise, skip it.
```

For Model, report the exact session model ID and effort from
`$CLAUDE_EFFORT` (Claude Code) or `$PI_REASONING_LEVEL` (Pi), else
`effort unknown`. Report measured elapsed time, not an estimate.

Use sections appropriate to the verdict:

````markdown
### Verdict

🟡 **HOLD** — <one-sentence recommendation and scope reviewed>

- **Model:** <exact model ID and effort, e.g. gemini-3.8-flash (high effort)>
- **Elapsed:** <measured duration, e.g. 2m 30s>

<!-- HOLD or STOP -->
### Worst thing that could happen
<Consequence and who or what it affects.>
### How it could happen
<Trigger → changed behaviour → impact, with preconditions, blast radius,
and cited code and safeguards.>
### Before commit or merge
<Smallest useful mitigation, decision, or check.>

<!-- PROCEED -->
### Why no material risk was found
<Why no concrete failure path is reachable; what you checked and why it stays
bounded.>
### Verified safeguards
<Code, tests, configuration, or guards, with path:line.>

<!-- HOLD, STOP, or PROCEED; omit when none -->
### What I couldn't confirm
<Only unknowns that could change the verdict.>

<!-- UNKNOWN -->
### Why this could not be assessed
<Missing access, unresolvable ref, or unavailable evidence.>
### What is needed to proceed
<Input, permission, or command that would unblock review.>
````

For an approved PR comment, start with this exact attribution, then the
verdict and report sections. Omit Model and Elapsed:

```txt
🤖 This review was written by an LLM agent (`<model ID>`, <effort> effort).
```
