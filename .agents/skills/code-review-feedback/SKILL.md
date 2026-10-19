---
name: code-review-feedback
description: >-
  Pressure-test code-review feedback before acting on it. Use when receiving
  review feedback or evaluating suggested code changes.
metadata:
  model-tier: moderate
---

# Code Review Feedback

Treat review feedback as suggestions to verify, not orders to follow:
understand every item, check it against the codebase, then fix it or push back
with technical reasoning. Technical correctness beats social comfort.

1. **Understand every item.** Read all the feedback, then restate each item in
   your own words. If any item is unclear, ask about it before implementing
   anything; items may be related, and a partial reading produces wrong fixes.
   Done when every item is understood.

   ```txt
   BAD:  Implement 1, 2, 3, and 6 now; ask about 4 and 5 later.
   GOOD: "I understand 1, 2, 3, and 6. I need clarification on 4 and 5
         before I start."
   ```

2. **Verify each item.** Feedback from the user is trusted; implement it once
   you understand it. Check other reviewers' feedback with skepticism:
   - Is it correct for this codebase, on every platform and version it
     supports?
   - Does it break existing behaviour or undo a deliberate choice, such as a
     legacy or compatibility reason?
   - Does the reviewer have the full context?
   - If it asks you to "implement properly", is the feature used? Grep for
     callers; if there are none, propose removing it instead (YAGNI).

   Done when each item is marked accept, push back, or can't verify.

3. **Respond.** For an item you can't verify, say what you'd need: "I can't
   verify this without X. Should I investigate, ask, or proceed?" If an item
   conflicts with an earlier decision of the user's, or is architectural,
   raise it with the user before acting; you and the reviewer both answer to
   them. Push back with technical reasoning, specific questions, and
   references to working tests or code, not defensiveness. If you're
   uncomfortable pushing back, tell the user what you've seen. Done when every
   item you didn't accept has a reply.

4. **Implement one at a time.** Fix blocking issues (breakage, security)
   first, then simple fixes (typos, imports), then complex ones (refactors,
   logic). Test each fix on its own, then check for regressions. Done when
   every accepted item is fixed and the tests pass.

**Tone.** Acknowledge a correct item by stating the fix: "Fixed: [what
changed]", "Good catch — [issue]. Fixed in [location].", or just show it in
the code. Never write performative agreement or gratitude ("You're absolutely
right!", "Great point!", "Thanks for catching that"): the first breaks the
user's instruction files, and none of them carry information. Delete it and
state the fix. Don't say "Let me implement that now" before you've verified.
If your pushback was wrong, say so in one line and move on: "You were right —
I checked X and it does Y. Fixing now." Skip the apology and the defence.

**GitHub threads.** Reply to an inline review comment in its own thread
(`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as a
top-level PR comment.
