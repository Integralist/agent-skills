---
name: arena
description: >-
  Parallel candidate attempts at one task, merged into a single best
  artifact. Use when the user wants several independent attempts compared and
  the strongest parts combined.
disable-model-invocation: true
metadata:
  model-tier: complex
---

# Arena

Fan out N parallel attempts at the same task, read every candidate end to
end, pick the strongest as the base, graft the best ideas from the others
into it, and verify the result. The arena runs autonomously, so open a todo
list with one entry per step below before launching anything; it keeps a
step from silently disappearing.

**Models.** Use the models the user names. Otherwise, if your harness lets
you set a subagent's model, run each candidate on the strongest model from a
different family your harness offers; if it offers one model, run it N times.
For a judge from another family when your harness has none, use a CLI found
the way the consensus skill finds its consultants
(`command -v agy gemini codex claude copilot`).

1. **Frame.** Every candidate gets the same prompt, so the prompt is the
   contract. State the artifact each candidate produces. Turn what success
   means for this task into 3–6 gradeable criteria, such as "adds a
   `--dry-run` flag that skips writes" rather than "code is correct"; the
   rubric is for picking, and candidates see only the task. Run one
   candidate per model, more when the task spans several design directions,
   or the same model N times when the work is generation-bound rather than
   judgment-sensitive. Give each candidate its own output location, a git
   worktree where possible or `/tmp/arena-<slug>/candidate-<n>/`, since a
   shared path is shared mutable state. Done when the task, rubric,
   runners, and paths are set.
2. **Fan out.** Spawn all N subagents in one message, in the background,
   following [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md).
   Give each the task, the shared grounding path, its output path, and a
   request for the artifact plus a short rationale naming the alternatives
   it considered and rejected; without the rationale you can't tell a
   principled structure from an accidental one when grafting. Retry a
   candidate that hits its turn limit with a higher limit; if it still
   produces nothing usable, carry on with N-1 and record the dropout. Done
   when every candidate has finished or dropped out.
3. **Cross-judge.** Once all candidates are done, never while they're still
   writing (the judge would see partial output as dropouts), spawn one
   read-only judge, preferably from a different model family from yours. It
   sees the rubric and the candidates by path label, scores each criterion,
   and recommends a base with its reasons. It runs while you read in step
   4. Done when its verdict is in.
4. **Pick a base.** Read every candidate end to end, since skimming favours
   whichever looks most familiar, and score each against the rubric
   criterion by criterion. Agreement with the judge confirms the pick;
   disagreement means bias or an ambiguous rubric, so read both rationales
   before deciding. Choose the candidate a future maintainer could extend
   most easily without breaking invariants, preferring the cleaner boundary
   or smaller surface when two tie. Done when the pick, the reason, and the
   judge's verdict are in a short synthesis note beside the base.
5. **Graft.** Walk each other candidate once more for what's worth porting,
   usually one or two things each. Fold each in by hand, redesigning so the
   result still holds one mental model rather than pasting. When the
   candidates converge on one shape, that's strong agreement: ship it with
   no graft. When they diverge wildly, step 1 was under-specified, so
   reframe and rerun rather than averaging. Done when the note records each
   graft and its source, and each rejection and why; the rejections teach
   future readers most.
6. **Verify** the merged artifact as you would any other output; the arena
   earns no pass. A problem the arena missed means step 1 was wrong
   (reframe and rerun) or a candidate caught it and you missed the graft
   (back to step 5). Done when verification passes.

**Output.** One merged artifact and a short synthesis note naming the base,
grafts with their sources, rejections, dropouts, turn-limit warnings after
the affected run summaries, and the verification result.
