---
name: decide
description: >-
  Decision memo with a contrarian check, saved to docs/decisions/. Use when
  the user wants help making a consequential, hard-to-reverse, or
  multi-stakeholder decision.
disable-model-invocation: true
argument-hint: '[short description of the decision]'
metadata:
  model-tier: complex
---

# Decide

Help the user make a consequential, hard-to-reverse, or multi-stakeholder
decision faster and better: interview them, structure the options with
explicit assumptions, red-team the logic, and save a memo with one
recommendation and a reversibility rating that they can revisit. The
interview runs in the main session; three subagents do the heavy thinking,
each one job. Follow the
[completion and retry protocol](../shared/SUBAGENT-STEERABILITY.md#completion-and-retry)
for each, and send any omission back to the same subagent to fix before
moving on.

1. **Interview** one question at a time, waiting for each answer, in this
   order:
   1. What's the decision, in one sentence?
   2. What are the options? With only one, ask for the alternatives,
      including doing nothing.
   3. Can any option avoid the central trade-off? Look for a smaller,
      staged, combined, or lateral option rather than accepting the framing.
   4. Why now? What changes if you wait?
   5. What's the decision window: a deadline, an opportunity cost, or a soft
      "off my plate by Friday"?
   6. What happens by default if no one acts?
   7. What does each option cost in money, time, focus, reputation, and
      optionality?
   8. What goes well if each option works?
   9. What's each option's worst plausible outcome you'd have to live with?
   10. What must be true for each serious option to be the right call?
   11. Which of those beliefs are you least sure about?
   12. Who else has a stake, whose buy-in matters, and what enthusiasm,
       resistance, or anxiety have they actually expressed? Record only
       sentiment they've communicated.
   13. What's reversible and what's one-way: a hat or a tattoo?
   14. What would make you change your mind?
   15. What's your gut call right now? Record it so the user can later see
       whether the analysis moved them or rationalised the gut.

   Push once on a thin answer ("Take a guess: what's the closest thing you
   do believe?"), then move on and flag the gap in the memo. Capture extra
   detail the user volunteers, but keep to the order. Done when all fifteen
   have an answer or a flagged gap.
2. **Structurer.** Summarise the answers and give the Structurer the full
   transcript and a kebab-case decision slug (`hire-vp-eng`). It drafts the
   memo in the template below without recommending or editorialising,
   writes `_(unanswered)_` for a missing or thin answer rather than inventing
   content, and classifies each decision-relevant claim as `Verified fact`,
   `User belief`, `Assumption`, or `Unknown`, never upgrading a belief to a
   fact. Done when the draft accounts for every answer and serious option and
   classifies every claim.
3. **Contrarian.** Give it the draft and frame it as a contrarian advisor
   whose job is to find what's wrong, defaulting to scepticism. It returns
   Markdown under these headings: hidden assumptions treated as fact;
   second-order effects 6–18 months out; selection bias in options dropped
   too fast or framed to prejudge the answer; sunk cost or momentum bias;
   reversibility mislabels; and the strongest case for every serious
   option, including the one the user leans away from. It's specific: not
   "you haven't thought about competitors" but "if competitor X mirrors this
   in 3 months, your moat is gone". Done when every heading is covered and
   every serious option steel-manned.
4. **Synthesizer.** Give it the draft and the critique to produce the final
   memo in the template. It recommends exactly one option; "it depends"
   isn't one, and if it truly can't recommend, the recommendation is to
   gather more information, naming the smallest step and the unknowns it
   resolves. It keeps the evidence classifications, marks every contrarian
   claim `_(contrarian)_`, and compares the recommendation with the gut
   call, saying loudly why if they differ. Done when the memo has every
   section and reads clearly six months later without the transcript.
5. **Save and close.** Write the memo to
   `docs/decisions/YYYY-MM-DD-<decision-slug>.md`, creating the directory if
   needed, present it, and ask:

   ```txt
   What now?

   1. Lock it in — I'll mark this decided and note the kill criteria.
   2. Revisit later — I'll mark it for revisit on a date you choose.
   3. Push back — identify the disputed input or reasoning and rerun from there.
   4. Something else.
   ```

   To lock it in, set `Status` to `Decided` and append `## Decided` with the
   option and date, leaving the kill criteria as they are. To revisit, ask
   for the date, set `Status` to `Revisit`, and add `Revisit date` to the
   metadata; you don't schedule or start the revisit. To push back, amend
   the disputed input and rerun from the earliest affected pass: Structurer
   for inputs, Contrarian for critique, Synthesizer for weighting. Done when
   the user's choice is applied.

## Memo template

````markdown
# Decision: {one-line decision}

- **Date:** YYYY-MM-DD
- **Status:** Draft | Decided | Revisit
- **Decision window:** {deadline or "soft"}
- **Reversibility:** Reversible | One-way door | Mostly reversible

## Context

{2–4 sentences. Why this decision, why now.}

## Evidence ledger

| Claim | Status | Source or verification needed |
| ----- | ------ | ----------------------------- |
| ...   | Verified fact / User belief / Assumption / Unknown | ... |

## Options

### Option A — {name}

- **What it is:** ...
- **Cost:** ...
- **Upside:** ...
- **Downside:** ...
- **Must be true for this to work:**
  - ...
- **Weakest assumption:** ...

### Option B — {name}

{same structure}

### Option C — Do nothing / status quo

{same structure}

## Stakeholders

| Who | Stake | Buy-in needed? | Expressed sentiment |
| --- | --- | --- | --- |
| ... | ... | Yes / No | Enthusiasm / resistance / anxiety / unknown |

## Contrarian pass

- **Hidden assumptions:** ...
- **Second-order effects:** ...
- **Selection bias:** ...
- **Sunk cost / momentum:** ...
- **Reversibility check:** ...
- **Steel-manned options:** ...

## Gut call

> {user's tentative answer from the interview}

## Recommendation

**{Option name}.**

{2–4 sentences: why this option, what trade-off the user accepts, and whether
the analysis matches or contradicts the gut call.}

## Kill criteria

If any of these become true, abandon or revisit:

- [ ] ...

## Open questions

{Anything still unanswered, with `_(unanswered)_` markers from the draft.}
````
