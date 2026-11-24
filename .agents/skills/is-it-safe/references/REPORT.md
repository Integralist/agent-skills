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

Keep it short. Read and follow [voice-product](../../voice-product/SKILL.md):
plain language for a human who may act. Name who does what, under which
condition, with what
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

Lead with the verdict and scope. Use the matching format without adding
headings to the report.

**HOLD or STOP**

````markdown
🟡 **HOLD** — <recommendation and scope reviewed>

<One short paragraph: what triggers the failure, how likely that trigger
is in normal use, and what happens. Cite the evidence as `path:line`.
If likelihood is unknown, name what's missing rather than guessing.>

**Blast radius and rollback:** <Who or what is likely affected, and what
would widen the impact if material. One-way door, two-way door, or
unknown: what rollback restores and what it can't undo.>

**Before commit or merge:** <Smallest useful mitigation or check.>
````

A two-way door can still warrant STOP if the impact before rollback is
unacceptable.

**PROCEED**

````markdown
🟢 **PROCEED** — <scope reviewed>

<One sentence on what keeps the worst credible outcome from happening,
with a `path:line` citation.>
````

**UNKNOWN**

````markdown
⚪ **UNKNOWN** — <scope reviewed and what couldn't be assessed>

**Needed:** <The input, access, or evidence that would unblock the review.>
````

For any verdict, add a separate **Not confirmed:** line only if the gap
could change the decision and isn't already stated. For chat, end with
**Model:** and **Elapsed:** on one line.

For an approved PR comment, start with this exact attribution, then use
the matching report format above. Omit Model and Elapsed:

```txt
🤖 This review was written by an LLM agent (`<model ID>`, <effort> effort).
```
