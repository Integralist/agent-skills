---
name: code-review-feedback
description: >-
  Pressure-test code-review feedback before acting on it. Use when receiving
  review feedback or evaluating suggested code changes.
metadata:
  model-tier: moderate
---

Treat review feedback as a suggestion to verify, not an order. Understand every
item, check it against the codebase, then fix it or push back with technical
reasoning. Technical correctness takes priority over social comfort.

1. **Understand all feedback before acting.** Read every item and restate it in
   your own words. If any item is unclear, ask about it before implementing
   anything; feedback items may be related, and partial reading can produce
   wrong fixes. For example:

   ```txt
   BAD:  Implement 1, 2, 3, and 6 now; ask about 4 and 5 later.
   GOOD: "I understand 1, 2, 3, and 6. I need clarification on 4 and 5
         before I start."
   ```

2. **Verify each item.** Feedback from the user is trusted: once understood,
   implement it. Check other reviewers' feedback skeptically:
   - Is it correct on every platform and version the codebase supports?
   - Could it break existing behavior or undo a deliberate legacy or
     compatibility choice?
   - Does the reviewer have the full context?
   - If the request says "implement properly," is the feature used? Grep for
     callers; if there are none, propose removing it instead (YAGNI).

   Mark each item **accept**, **push back**, or **can't verify**.
3. **Respond.** For an item you cannot verify, say what evidence is missing
   and ask whether to investigate, ask, or proceed. Raise conflicts with an
   earlier user decision, or architectural feedback, with the user before
   acting. Push back using technical reasoning, specific questions, and
   references to working tests or code—not defensiveness. If you are
   uncomfortable pushing back, tell the user what you found. Every item not
   accepted needs a reply.
4. **Implement accepted items one at a time.** Fix blocking issues (breakage,
   security) first, then simple fixes (typos, imports), then complex ones
   (refactors, logic). Test each fix on its own and check for regressions.
   Finish when every accepted item is fixed and tests pass.

## Tone

Acknowledge a correct item by stating the fix: "Fixed: [what changed],"
"Good catch — [issue]. Fixed in [location]," or simply show the code. Do not
write performative agreement or gratitude ("You're absolutely right!",
"Great point!", "Thanks for catching that"): it breaks the user's instruction
files and adds no information. Delete it and state the fix. Do not promise to
implement before verifying. If your pushback was wrong, say so in one line:
"You were right — I checked X and it does Y. Fixing now." Skip the apology and
defence.

## GitHub threads

Reply to an inline review comment in its own thread with
`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`, not as a
top-level PR comment.
