---
name: perspectives
description: >-
  Multi-perspective analysis of a problem or proposal through evidence,
  sentiment, risks, benefits, alternatives, and process. Use for a quick "what
  are we missing?" pass. Do not use to choose a consequential option, run
  cross-model deliberation, or review code.
user-invocable: true
argument-hint: '[topic or proposal] [optional: perspective]'
---

# Perspectives

Analyze a problem, proposal, or design through six isolated perspectives, then
synthesize what matters. This is a lightweight exploration tool based on Edward
de Bono's Six Thinking Hats framework. It broadens the conversation; it does
not replace `decide`, `consensus`, or `code-review`.

## Routing

- Use `perspectives` for quick breadth, brainstorming, or "what are we
  missing?"
- Use `decide` when the user must choose between consequential options and
  needs a durable recommendation.
- Use `consensus` when a complex assessment or implementation needs independent
  cross-model review and user approval gates.
- Use `code-review` when code or a diff exists and the goal is to find defects.

## Input

Accept a topic or proposal and an optional perspective. If the topic is too
vague to frame as one focused question, ask one clarifying question. Otherwise,
start immediately.

Perspective aliases:

| Perspective  | Aliases                       |
| ------------ | ----------------------------- |
| Evidence     | white, facts, data, unknowns  |
| Sentiment    | red, feelings, gut, reactions |
| Risks        | black, caution, failure       |
| Benefits     | yellow, optimism, upside      |
| Alternatives | green, creative, options      |
| Process      | blue, meta, next steps        |

## Full Analysis

When no perspective is specified:

1. Restate the topic as a focused one-sentence question.
1. Analyze all six perspectives in the order below. Keep each section within
   its assigned mode; integration happens only in synthesis.
1. Synthesize the decision-relevant insights and smallest useful next step.

### Evidence

- Separate verified facts, user-supplied claims, assumptions, and unknowns.
- Cite available evidence. Label unsupported claims; do not invent facts.
- Identify the unknowns most likely to change the conclusion.

### Sentiment

- Record the user's stated intuition and stakeholder sentiment.
- When no sentiment was supplied, describe plausible reactions explicitly as
  hypotheses, not facts or the agent's own feelings.
- Keep this section short. Feelings matter as signals, not proof.

### Risks

- Identify plausible failure modes, downsides, constraints, and second-order
  effects.
- Be genuinely critical, but distinguish demonstrated risks from speculation.

### Benefits

- Identify plausible benefits, leverage, opportunities, and best-case outcomes.
- State what must be true for each important benefit to materialize.

### Alternatives

- Generate options that avoid or change the central trade-off.
- Include doing nothing, staged approaches, smaller experiments, and combined
  options when relevant.
- Allow unconventional ideas, but label impractical ones.

### Process

- Assess whether the question is framed well and whether more analysis is
  useful.
- Identify the owner or decision-maker when known and any evidence needed
  before action.

## Synthesis

Conclude with:

- The one or two insights most likely to affect the outcome
- Any sentiment that should be acknowledged
- The strongest unresolved unknown
- A concrete next step or recommendation

Do not force a decision when the task is exploratory. If the analysis reveals
a consequential choice, recommend continuing with `decide`. If it reveals a
need for independent model review, recommend `consensus`.

## Focused Analysis

When the user specifies one perspective, run only that perspective in depth and
skip synthesis. Use 5-10 concise points and a brief framing sentence.

Use the practical perspective names as output headings rather than colors.
