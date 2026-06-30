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

Help the user make better, faster decisions on consequential,
hard-to-reverse, or multi-stakeholder choices by structuring their
thinking, red-teaming their logic, and producing a saved memo they
can revisit.

Three subagent passes, each a distinct cognitive job:

| Pass        | Purpose                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| Structurer  | Organize the interview into a clean draft memo.                          |
| Contrarian  | Red-team the logic; surface hidden assumptions and second-order effects. |
| Synthesizer | Weigh structure vs. contrarian pass; recommend; rate reversibility.      |

The interview happens in the main session. Subagents only enter
for the heavy thinking.

## Step 1 — Run the interview

Ask **one** question at a time. Do not batch. Wait for the answer
before moving on. Ask in this order:

1. **What's the decision?** — In one sentence.
1. **What are the options?** — List them. If only one, ask "What
   are the alternatives, including doing nothing?"
1. **Why now?** — Why decide today/this week/this month? What
   changes if you wait?
1. **What's the decision window?** — Deadline, opportunity cost, or
   a soft "off my plate by Friday."
1. **What's the decision unmade?** — Default outcome if no action
   is taken.
1. **What does each option cost?** — Money, time, focus,
   reputation, optionality. Per-option, briefly.
1. **What's the upside of each option?** — What goes well if it
   works.
1. **What's the downside?** — Per option, the worst plausible
   outcome you'd have to live with.
1. **What must be true for option X to be the right call?** —
   Repeat for each serious option. Surfaces the assumptions.
1. **Which of those beliefs are you least sure about?** — The
   weakest link.
1. **Who else has a stake?** — Co-founder, team, investors,
   customers, family. Whose buy-in matters.
1. **What's reversible vs. one-way?** — Is this a hat or a tattoo?
1. **What would make you change your mind?** — Kill criteria.
1. **Gut call right now?** — Force a tentative answer before the
   analysis. Recorded so the user can later check whether the
   analysis moved them or just rationalized the gut call.

If the user gives a thin answer ("I dunno"), push once: "Take a
guess — what's the closest thing you do believe?" Move on if they
still won't bite, but flag the gap in the memo.

If the user volunteers extra detail mid-question, capture it but
stay on the ordered list. Don't let the interview wander.

## Step 2 — Spawn the Structurer subagent

After the interview, summarise the captured answers and spawn the
Structurer. Its instructions must include:

- The full interview transcript (questions and answers).
- The decision slug (e.g., `hire-vp-eng`, `kill-feature-x`).
- Produce a draft memo using the Output template below — Context,
  Options, Assumptions per option, Costs, Upside, Downside,
  Reversibility, Stakeholders, Gut call, Kill criteria.
- "Do not recommend. Do not editorialize. Just structure."
- "If an answer is missing or thin, write `_(unanswered)_` rather
  than inventing content."
- "Return the draft memo as Markdown."

Wait for the Structurer before spawning the Contrarian.

## Step 3 — Spawn the Contrarian subagent

Pass the Structurer's draft to the Contrarian, instructed to
red-team it. Its instructions must include:

- The full draft memo.
- Role framing: "You are a contrarian advisor. Your job is to find
  what's wrong, not to validate. Default to skepticism."
- Required output sections:
  - **Hidden assumptions** — beliefs the user treats as fact.
  - **Second-order effects** — what happens 6–18 months out that
    the user hasn't priced in.
  - **Selection bias** — options excluded too quickly, or framed in
    a way that prejudged the answer.
  - **Sunk cost / momentum bias** — choices driven by past
    investment rather than future expected value.
  - **Reversibility check** — decisions labelled reversible that
    aren't, or vice versa.
  - **Steel-manned alternative** — the strongest case for the
    option the user is leaning *away* from.
- "Be specific. 'You haven't thought about competitors' is useless.
  'If competitor X mirrors this in 3 months, your moat is gone' is
  useful."
- "Return findings as Markdown, organized under the sections above."

Wait for the Contrarian before spawning the Synthesizer.

## Step 4 — Spawn the Synthesizer subagent

Pass both the Structurer draft and the Contrarian critique to the
Synthesizer to produce the final memo. Its instructions must
include:

- The Structurer's draft memo.
- The Contrarian's findings.
- "Produce the final memo in the Output format below. You must
  recommend a single option. 'It depends' is not a recommendation.
  If you genuinely cannot recommend, the recommendation is 'gather
  more information' and you must specify exactly which one piece of
  information would resolve it."
- "Mark every claim from the user with the user's language. Mark
  every claim from the Contrarian as `_(contrarian)_`. Don't blend
  them silently."
- "Compare the recommendation to the user's gut call. If they
  agree, say so. If they disagree, say so loudly and explain why
  the analysis diverged from the gut."
- "Return the final memo as Markdown using the Output template."

## Step 5 — Save the memo

Write the Synthesizer's output to:

```txt
docs/decisions/YYYY-MM-DD-<decision-slug>.md
```

Create `docs/decisions/` if it doesn't exist. The slug is a
kebab-case version of the decision (e.g., `hire-vp-eng`,
`kill-pricing-tier-b`).

Then present the memo and ask:

```txt
What now?

1. Lock it in — I'll mark this decided and note the kill criteria.
2. Sleep on it — I'll save the memo and we revisit tomorrow.
3. Push back — tell me where the analysis is wrong and we re-run.
4. Something else.
```

If the user picks "Lock it in", append a `## Decided` section with
the chosen option, the date, and the kill criteria as a checklist.

## Output template

The final memo (produced by the Synthesizer) must follow this
structure:

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

- Keep the three passes separate — structuring, adversarial
  reasoning, and synthesis are different jobs; blending them
  weakens each. Don't collapse them into one subagent unless the
  user explicitly asks for a fast version.
- Don't skip the gut-call question. Without it, the synthesised
  recommendation can't be checked against the user's intuition,
  which is the whole point of separating analysis from instinct.
- The memo is a tool for the user, not a deliverable for someone
  else. Optimise for "the user can re-read this in 6 months and
  remember why" over external polish.
