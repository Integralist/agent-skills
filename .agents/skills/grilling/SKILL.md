---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
metadata:
  model-tier: complex
---

Interview the user until you reach shared understanding. Map the subject as a
**design tree**: each decision branches into the decisions that depend on it.

## Ask questions in rounds

The **frontier** is the set of decisions whose prerequisites are settled—the
questions you can ask now without guessing. Ask every question on the current
frontier in one round. Number the questions and recommend an answer for each.
Then wait for the user's answers before the next round.

Use this format:

```txt
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

A user's answers reshape the tree. Recompute the frontier after each round:
settled decisions may unblock new questions. Put a question in a later round
if its answer depends on another question still open in this round.

## Find facts; ask for decisions

Finding facts is the agent's job, not the user's. When a frontier question
needs an environmental fact, dispatch a subagent on the cheapest adequate
model tier. Follow the
[shared subagent guidance](../shared/SUBAGENT-STEERABILITY.md), including its
completion and retry protocol. Do not block on running
exploration: wait only for questions that depend on its result, and ask the
rest of the frontier now. Put decisions to the user and wait for their answer.

## Stop condition

The session is complete when the frontier is empty: every branch of the
design tree has been visited and nothing remains silently assumed. Do not act
until the user confirms shared understanding.
