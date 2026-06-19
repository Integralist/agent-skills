---
name: decide
description: >-
  Decision Memo + Contrarian Check. Runs an interview,
  structures the options with explicit assumptions, dispatches
  a contrarian pass to find holes and second-order effects, and
  produces a saved decision memo with a clear recommendation and
  reversibility rating.
disable-model-invocation: true
argument-hint: '[short description of the decision]'
---

# /decide — Decision Memo + Contrarian Check

Help the user make better, faster decisions on consequential, hard-to-reverse,
or multi-stakeholder choices by structuring their thinking, red-teaming their
logic, and producing a saved memo they can revisit.

The skill orchestrates three subagent passes, each focused on a different
cognitive job:

| Pass        | Purpose                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Structurer  | Organize the interview into a clean draft memo (context, options, assumptions, pros/cons)        |
| Contrarian  | Red-team the logic, surface hidden assumptions, name second-order effects                        |
| Synthesizer | Weigh the structure against the contrarian pass, recommend, name reversibility and kill criteria |

The interview itself happens in the main session (the agent talking to the
user). Subagents only enter for the heavy thinking.

## Step 1 — Run the interview

Ask **one** question at a time. Do not batch. Wait for the user's answer
before moving on.

Ask in this order:

1. **What's the decision?** — In one sentence.
1. **What are the options on the table?** — List them. If only one, ask "What
   are the alternatives, including doing nothing?"
1. **Why now?** — Why is this forcing a decision today, this week, this month?
   What changes if you wait?
1. **What's the decision window?** — Deadline, opportunity cost, or a soft "I
   want this off my plate by Friday."
1. **What's the decision unmade?** — What does the world look like if you
   don't decide? Default outcome if no action is taken.
1. **What does each option cost?** — Money, time, focus, reputation,
   optionality. Ask per-option, briefly.
1. **What's the upside of each option?** — What goes well if it works.
1. **What's the downside?** — Per option, what's the worst plausible outcome
   you'd actually have to live with.
1. **What do you believe must be true for option X to be the right call?** —
   Repeat for each serious option. This surfaces the assumptions.
1. **Which of those beliefs are you least sure about?** — The weakest link.
1. **Who else has a stake?** — Co-founder, team, investors, customers, family.
   Whose buy-in matters.
1. **What's reversible vs. one-way?** — Is this a hat or a tattoo?
1. **What would make you change your mind?** — Kill criteria. If X happens,
   you abandon this path.
1. **Gut call right now?** — Force a tentative answer before the analysis.
   This gets recorded so the user can later check whether the analysis moved
   them or just rationalized the gut call.

If the user gives a thin answer ("I dunno"), push once: "Take a guess —
what's the closest thing you do believe?" Move on if they still won't bite,
but flag the gap in the memo.

If the user volunteers extra detail mid-question, capture it but stay on the
ordered list. Don't let the interview wander.

## Step 2 — Spawn the Structurer subagent

Once the interview is done, summarise the captured answers and spawn a
subagent for structuring.

The Structurer's instructions must include:

- The full interview transcript (questions and answers).
- The decision slug (e.g., `hire-vp-eng`, `kill-feature-x`).
- Instruction to produce a draft memo using the template in the Output section
  below — Context, Options, Assumptions per option, Costs, Upside, Downside,
  Reversibility, Stakeholders, Gut call, Kill criteria.
- Instruction: "Do not recommend. Do not editorialize. Just structure."
- Instruction: "If an answer is missing or thin, write `_(unanswered)_`
  rather than inventing content."
- Instruction: "Return the draft memo as Markdown."

Wait for the Structurer to finish before spawning the Contrarian.

## Step 3 — Spawn the Contrarian subagent

Pass the Structurer's draft to a second subagent, instructed to red-team it.

The Contrarian's instructions must include:

- The full draft memo from the Structurer.
- Role framing: "You are a contrarian advisor. Your job is to find what's
  wrong, not to validate. Default to skepticism."
- Required output sections:
  - **Hidden assumptions** — beliefs the user is treating as fact.
  - **Second-order effects** — what happens 6–18 months out that the user
    hasn't priced in.
  - **Selection bias** — options the user excluded too quickly, or framed in
    a way that prejudged the answer.
  - **Sunk cost / momentum bias** — places where the user is choosing because
    of past investment rather than future expected value.
  - **Reversibility check** — places the user labelled a decision reversible
    that aren't, or vice versa.
  - **Steel-manned alternative** — the strongest case for the option the user
    seems to be leaning *away* from.
- Instruction: "Be specific. 'You haven't thought about competitors' is
  useless. 'If competitor X mirrors this in 3 months, your moat is gone' is
  useful."
- Instruction: "Return findings as Markdown, organized under the sections
  above."

Wait for the Contrarian to finish before spawning the Synthesizer.

## Step 4 — Spawn the Synthesizer subagent

Pass both the Structurer draft and the Contrarian critique to a third
subagent to produce the final memo.

The Synthesizer's instructions must include:

- The Structurer's draft memo.
- The Contrarian's findings.
- Instruction: "Produce the final memo in the format specified below. You
  must recommend a single option. 'It depends' is not a recommendation. If
  you genuinely cannot recommend, the recommendation is 'gather more
  information' and you must specify exactly which one piece of information
  would resolve it."
- Instruction: "Mark every claim that came from the user with the user's
  language. Mark every claim that came from the Contrarian as
  `_(contrarian)_`. Don't blend them silently."
- Instruction: "Compare the recommendation to the user's gut call. If they
  agree, say so. If they disagree, say so loudly and explain why the analysis
  diverged from the gut."
- Instruction: "Return the final memo as Markdown using the Output template."

## Step 5 — Save the memo

Write the Synthesizer's output to:

```txt
docs/decisions/YYYY-MM-DD-<decision-slug>.md
```

Create `docs/decisions/` if it doesn't exist. The slug comes from a
kebab-case version of the decision (e.g., `hire-vp-eng`,
`kill-pricing-tier-b`).

Then present the memo to the user in the conversation and ask:

```txt
What now?

1. Lock it in — I'll mark this decided and note the kill criteria.
2. Sleep on it — I'll save the memo and we revisit tomorrow.
3. Push back — tell me where the analysis is wrong and we re-run.
4. Something else.
```

If the user picks "Lock it in", append a `## Decided` section to the memo
with the chosen option, the date, and the kill criteria as a checklist.

## Output template

The final memo (produced by the Synthesizer) must follow this structure:

```markdown
# Decision: {one-line decision}

- **Date:** YYYY-MM-DD
- **Status:** Draft | Decided | Revisit
- **Decision window:** {deadline or "soft"}
- **Reversibility:** Reversible | One-way door | Mostly reversible

## Context

{2–4 sentences. Why this decision, why now.}

## Options

### Option A — {name}

- **What it is:** ...
- **Cost:** ...
- **Upside:** ...
- **Downside:** ...
- **Must be true for this to work:**
  - ...
  - ...
- **Weakest assumption:** ...

### Option B — {name}

{same structure}

### Option C — Do nothing / status quo

{same structure}

## Stakeholders

| Who           | Stake                          | Buy-in needed?  |
| ------------- | ------------------------------ | --------------- |
| ...           | ...                            | Yes / No        |

## Contrarian pass

- **Hidden assumptions:** ...
- **Second-order effects:** ...
- **Selection bias:** ...
- **Sunk cost / momentum:** ...
- **Reversibility check:** ...
- **Steel-manned alternative:** ...

## Gut call

> {user's tentative answer from the interview}

## Recommendation

**{Option name}.**

{2–4 sentences explaining why this option, what trade-off the user is accepting,
and whether the analysis matches or contradicts the gut call.}

## Kill criteria

If any of these become true, abandon or revisit:

- [ ] ...
- [ ] ...

## Open questions

{Anything still unanswered. Use `_(unanswered)_` markers from the draft.}
```

## Notes

- The three passes are kept separate on purpose — structuring, adversarial
  reasoning, and synthesis are different jobs and blending them weakens each.
  Don't collapse them into a single subagent unless the user explicitly asks
  for a fast version.
- Don't skip the gut-call question. Without it, the synthesised
  recommendation can't be checked against the user's intuition, which is the
  whole point of separating analysis from instinct.
- The memo is a tool for the user, not a deliverable for someone else.
  Optimise for "the user can re-read this in 6 months and remember why"
  rather than for external polish.
