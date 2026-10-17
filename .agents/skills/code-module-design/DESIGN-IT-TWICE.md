# Design It Twice

Explore alternative interfaces for a chosen deepening candidate by having
parallel subagents design it in radically different ways, then compare them;
your first idea is rarely the best (Ousterhout). Uses the vocabulary in
[SKILL.md](SKILL.md) and the dependency categories in
[DEEPENING.md](DEEPENING.md).

1. **Frame the problem** for the user: the constraints any new interface must
   meet, the dependencies it relies on and their categories, and a rough code
   sketch that makes the constraints concrete (an illustration, not a
   proposal). Show it and go straight on to step 2; the user reads while the
   subagents work. Done when the framing is shown.
2. **Spawn three or more subagents in parallel,** following
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md). Give each a
   technical brief, separate from the user's framing: file paths, coupling,
   dependency category, what sits behind the seam, and the vocabulary from
   [SKILL.md](SKILL.md) plus the project's `GLOSSARY.md`. If only a legacy
   `CONTEXT.md` exists, use it and warn the user with `⚠️` to rename it to
   `GLOSSARY.md`. Give each subagent a different constraint:

   - Minimise the interface: one to three entry points, maximum leverage
     each.
   - Maximise flexibility: many use cases and extension points.
   - Optimise for the most common caller: make the default case trivial.
   - Where dependencies cross a seam: design around ports and adapters.

   Ask each for the interface (types, methods, parameters, invariants,
   ordering, error modes), a caller's usage example, what the implementation
   hides, the dependency strategy and adapters, and the trade-offs: where
   leverage is high and where it's thin. Done when every subagent has
   returned all five, with incomplete ones retried per the steerability
   guide.
3. **Present and compare.** Show the designs one at a time, then compare them
   in prose by depth, locality, and seam placement. Recommend the strongest
   and say why, proposing a hybrid if parts combine well; the user wants a
   strong read, not a menu. Done when you've given a recommendation.
