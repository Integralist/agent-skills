---
name: code-review-feedback
description: Pressure-test code-review feedback before acting on it — verify each suggestion with technical rigor rather than complying reflexively. Use when receiving review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable.
---

# Code Review Reception

Review feedback is suggestions to evaluate, not orders to follow. Verify
before implementing; ask before assuming; technical correctness over social
comfort.

## Response pattern

1. **Read** the complete feedback without reacting.
1. **Understand** — restate each requirement in your own words, or ask.
1. **Verify** against the actual codebase.
1. **Evaluate** — is it sound for *this* codebase?
1. **Respond** with a technical acknowledgment or reasoned pushback.
1. **Implement** one item at a time, testing each.

## Never say these

- "You're absolutely right!" — explicit instruction-file violation.
- "Great point!" / "Excellent feedback!" — performative.
- "Let me implement that now" — before verification.
- Any gratitude ("Thanks for catching that"). If you catch yourself writing
  "Thanks", delete it and state the fix instead. Actions speak; the code shows
  you heard the feedback.

Instead: restate the requirement, ask clarifying questions, push back with
technical reasoning, or just start working.

## Unclear feedback → stop

If any item is unclear, stop. Do not implement anything yet — items may be
related, and partial understanding produces wrong implementation. Ask for
clarification on the unclear items first.

> Partner: "Fix 1-6". You understand 1,2,3,6; unclear on 4,5.
> Right: "Understand 1,2,3,6. Need clarification on 4 and 5 before
> proceeding." (Wrong: implement 1,2,3,6 now, ask about 4,5 later.)

## Source-specific handling

**From your human partner** — trusted; implement after understanding. Still
ask if scope is unclear. No performative agreement; skip to action or a
technical acknowledgment.

**From external reviewers** — be skeptical, but check carefully. Before
implementing, verify:

1. Technically correct for THIS codebase?
1. Breaks existing functionality?
1. Is there a reason for the current implementation?
1. Works on all platforms/versions?
1. Does the reviewer understand the full context?

- If the suggestion seems wrong, push back with technical reasoning.
- If you can't verify: "I can't verify this without [X]. Should I
  [investigate/ask/proceed]?"
- If it conflicts with your partner's prior decisions, stop and discuss with
  your partner first.

## YAGNI check for "professional" features

If a reviewer suggests "implementing properly", grep the codebase for actual
usage.

- Unused: "This endpoint isn't called. Remove it (YAGNI)?"
- Used: implement properly.

Rule: you and the reviewer both report to your partner. If the feature isn't
needed, don't add it.

## Implementation order

For multi-item feedback:

1. Clarify anything unclear first.
1. Implement: blocking issues (breaks, security) → simple fixes (typos,
   imports) → complex fixes (refactoring, logic).
1. Test each fix individually.
1. Verify no regressions.

## Pushing back

Push back when the suggestion: breaks existing functionality; comes from a
reviewer lacking full context; violates YAGNI; is technically incorrect for
this stack; ignores legacy/compatibility reasons; or conflicts with your
partner's architectural decisions.

How: use technical reasoning, not defensiveness. Ask specific questions.
Reference working tests/code. Involve your partner if the issue is
architectural. If you're uncomfortable pushing back out loud, name that tension
and tell your partner what you've seen — they'll appreciate the honesty.

## Acknowledging correct feedback

State the fix, not gratitude:

- "Fixed. [What changed]"
- "Good catch — [specific issue]. Fixed in [location]."
- Or just fix it and show it in the code.

## Correcting your own pushback

If you pushed back and were wrong, state it factually and move on — no long
apology, no defending why you pushed back, no over-explaining:

- "You were right — I checked [X] and it does [Y]. Implementing now."
- "Verified; you're correct. My initial understanding was wrong because
  [reason]. Fixing."

## Common mistakes

| Mistake                      | Fix                                 |
| ---------------------------- | ----------------------------------- |
| Performative agreement       | State requirement or just act       |
| Blind implementation         | Verify against codebase first       |
| Batch without testing        | One at a time, test each            |
| Assuming reviewer is right   | Check if it breaks things           |
| Avoiding pushback            | Technical correctness > comfort     |
| Partial implementation       | Clarify all items first             |
| Can't verify, proceed anyway | State limitation, ask for direction |

## GitHub thread replies

When replying to inline review comments on GitHub, reply in the comment thread
(`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as a
top-level PR comment.
