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

Help the user make consequential, hard-to-reverse, or multi-stakeholder
decisions. Interview; structure options and assumptions, red-team reasoning,
and save a revisitable memo with one recommendation and a reversibility rating.
Interview in the main session. Three subagents each do one job;
follow the
[completion and retry
protocol](../shared/SUBAGENT-STEERABILITY.md#completion-and-retry)
for each and return omissions to that subagent.

1. **Interview.** Ask one at a time, in order; wait for each answer:
   1. What's the decision, in one sentence?
   2. What are the options? If there is only one, ask for alternatives,
      including doing nothing.
   3. Can an option avoid the central trade-off? Look for a smaller, staged,
      combined, or lateral option rather than accepting the framing.
   4. Why now? What changes if you wait?
   5. What's the decision window: a deadline, opportunity cost, or soft
      "off my plate by Friday"?
   6. What happens by default if nobody acts?
   7. What does each option cost in money, time, focus, reputation, and
      optionality?
   8. What goes well if each option works?
   9. What's each option's worst plausible outcome you'd have to live with?
   10. What must be true for each serious option to be the right call?
   11. Which of those beliefs are you least sure about?
   12. Who else has a stake, whose buy-in matters, and what enthusiasm,
       resistance, or anxiety have they actually expressed? Record only
       communicated sentiment.
   13. What's reversible and what's one-way: a hat or a tattoo?
   14. What would make you change your mind?
   15. What's your gut call right now? Record it so the user can later see
       whether the analysis moved them or rationalised the gut.

   For a thin answer, push once: "Take a guess: what's the closest thing you
   do believe?" Then move on and mark the gap in the memo. Capture volunteered
   detail; keep the order. Continue until every question is answered or has a
   flagged gap.
2. **Structurer.** Summarize answers; send the full transcript and a
   kebab-case decision slug (e.g. `hire-vp-eng`) to the subagent. It drafts
   from [MEMO-TEMPLATE.md](references/MEMO-TEMPLATE.md) without recommending or
   editorializing. It marks missing or thin answers `_(unanswered)_` rather
   than inventing, covers every answer and serious option, and classifies each
   decision-relevant claim `Verified fact`, `User belief`, `Assumption`, or
   `Unknown`—never upgrade a belief to fact.
3. **Contrarian.** Have a skeptical subagent challenge the draft; require
   Markdown with these headings:
   - Hidden assumptions treated as fact.
   - Second-order effects 6–18 months out.
   - Selection bias in options dropped too fast or framed to prejudge the
     answer.
   - Sunk cost or momentum bias.
   - Reversibility mislabels.
   - Strongest case for every serious option, including the one the user leans
     away from.

   Require specific claims (e.g. "if competitor X mirrors this in 3 months,
   your moat is gone"), not generic warnings. Continue when all headings are
   covered and every serious option is steel-manned.
4. **Synthesizer.** Give the draft and critique to a subagent to produce the
   final memo from [MEMO-TEMPLATE.md](references/MEMO-TEMPLATE.md). Require
   exactly one recommended option; if none is possible, recommend information
   gathering and name the smallest step and unknowns it resolves. Preserve
   evidence classifications, mark every contrarian claim `_(contrarian)_`, and
   compare the recommendation with the gut call, explaining any difference.
   Continue when complete and understandable six months later without the
   transcript.
5. **Save and close.** Write to
   `docs/decisions/YYYY-MM-DD-<decision-slug>.md`, creating the directory if
   needed. Present it and ask:

   ```txt
   What now?

   1. Lock it in — I'll mark this decided and note the kill criteria.
   2. Revisit later — I'll mark it for revisit on a date you choose.
   3. Push back — identify the disputed input or reasoning and rerun from there.
   4. Something else.
   ```

   Wait for the user's choice before changing status; apply only that choice:
   - **Lock it in:** Set `Status` to `Decided` and append `## Decided` with the
     option and date. Leave kill criteria unchanged.
   - **Revisit:** Ask for a date, set `Status` to `Revisit`, and add `Revisit
     date` to metadata. Do not schedule or start the revisit.
   - **Push back:** Amend the disputed input and rerun from the earliest
     affected pass: Structurer for inputs, Contrarian for critique, Synthesizer
     for weighting.

   Finish when the user's choice is applied.

## Memo template

The full memo structure and required fields are in
[MEMO-TEMPLATE.md](references/MEMO-TEMPLATE.md). Load it before the Structurer
or Synthesizer drafts the memo.
