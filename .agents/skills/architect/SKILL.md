---
name: architect
description: >-
  Take a feature from an idea to a spec and plan by running the research,
  spec, grill, and plan skills in order. Use when architecting a feature from
  an idea or this session's discussion, or exploring a design before planning.
metadata:
  model-tier: complex
---

# Architect

Take a feature from an idea to a spec and plan by running other skills in
order: bootstrap, research, spec, grill, plan. Coordinate only: each skill does
its own job, and you decide what runs next and carry context between them.
Keep every artifact in one `projects/<yyyy-mm-dd>-<slug>/` folder, and pass it
to each skill once it exists. When the project has an approved PDD Design,
that Design is the idea: start at step 3.

**Stop and ask.** When a skill reports a gap, or the design doesn't make
sense, tell the user and wait. Don't fill the gap with a guess.

1. **Bootstrap.** Use the agents-md skill so the project's instructions are in
   place. Take the idea from the user's message or this session's discussion;
   with neither, ask what to build. If the idea is vague, use the clarify
   skill. Done when you know what to build and why.

2. **Research.** Use the research skill on the idea, scoped to the project
   folder. Then ask whether to research another topic or move on. Done when
   the user is ready for a spec.

3. **Spec.** Use the to-spec skill with the idea and the research. Done when
   `spec.md` is written.

4. **Grill.** Use the grill-with-docs skill to stress-test the spec. If
   grilling changes a decision, testing seam, or acceptance criterion, update
   `spec.md` to match. Done when grilling ends and the spec reflects it.

5. **Plan.** Use the to-plan skill with the spec. Then use the to-adr skill on
   the plan; when it writes no ADR, note why in the plan's Notes. Unless the
   project started from a PDD Design, offer the to-prd skill for stakeholder
   framing, and run it only if the user wants it.
   Done when each slice has the acceptance verification contract required by
   to-plan, and the ADRs and PRD are settled. This finishes planning, not
   implementation or passing acceptance tests.

6. **Hand off.** Ask the user to choose one next step, and start only that one:

   1. Execute the plan with the execute-plan skill, or by hand: tell the user
      to run `/to-tasks <plan-path> slice-1` (`/to-tasks <plan-path>` for a
      single-slice plan).
   2. Research another topic: return to step 2.
   3. Write another plan: return to step 5.
