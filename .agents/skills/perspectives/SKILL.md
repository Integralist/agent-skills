---
name: perspectives
description: >-
  Quick multi-viewpoint "what are we missing?" pass on a problem, proposal,
  or design. Use when evaluating ideas, proposals, or trade-offs.
user-invocable: true
argument-hint: '[topic or proposal] [optional: perspective]'
metadata:
  model-tier: complex
---

# Perspectives

Look at a problem, proposal, or design through six isolated perspectives,
based on Edward de Bono's Six Thinking Hats, then pull out what matters.
It's for breadth: for a consequential choice that needs a durable
recommendation, use the decide skill; for cross-model review with approval
gates, use consensus; and to find defects in existing code, use code-review.

**Input.** Take a topic or proposal and an optional perspective. If the topic
is too vague to frame as one focused question, ask one clarifying question;
otherwise start. Name each perspective by its practical name, not its colour,
and accept these aliases:

| Perspective  | Aliases                       |
| ------------ | ----------------------------- |
| Evidence     | white, facts, data, unknowns  |
| Sentiment    | red, feelings, gut, reactions |
| Risks        | black, caution, failure       |
| Benefits     | yellow, optimism, upside      |
| Alternatives | green, creative, options      |
| Process      | blue, meta, next steps        |

**One perspective.** When the user names one, cover only it, in depth: a
short framing sentence and 5–10 concise points, with no synthesis.

## Full analysis

1. **Restate** the topic as one focused question. Done when it fits in a
   sentence.
2. **Work each perspective in order,** keeping each to its own mode;
   combining them is the synthesis's job. Done when all six are written.
   - **Evidence:** separate verified facts, user-supplied claims,
     assumptions, and unknowns; cite what evidence exists, label
     unsupported claims, and name the unknowns most likely to change the
     conclusion.
   - **Sentiment:** the user's stated intuition and stakeholders' feelings.
     With none supplied, describe plausible reactions as hypotheses, not
     facts or your own feelings. Keep it short: feelings are signals, not
     proof.
   - **Risks:** failure modes, downsides, constraints, and second-order
     effects, critically, telling demonstrated risks from speculation.
   - **Benefits:** benefits, leverage, opportunities, and best cases, each
     with what must be true for it to happen.
   - **Alternatives:** options that avoid or change the central trade-off,
     including doing nothing, staging, smaller experiments, and
     combinations; unconventional ideas are welcome, labelled if
     impractical.
   - **Process:** whether the question is framed well and more analysis
     would help, the owner or decision-maker if known, and any evidence
     needed before acting.
3. **Synthesise:** the one or two insights most likely to change the
   outcome, any sentiment worth acknowledging, the strongest unresolved
   unknown, and a concrete next step. Leave an exploratory question open
   rather than forcing a decision; recommend decide for a consequential
   choice that emerges, or consensus for a need for independent model
   review. Done when the next step is named.
