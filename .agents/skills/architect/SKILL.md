---
name: architect
description: >-
  Take a feature from an idea through research, grilling, a spec, and a plan.
  Use when architecting a feature from an idea or this session's discussion,
  or exploring a design before planning.
metadata:
  model-tier: complex
---

Coordinate a feature through skills in order:
[agents-md](../agents-md/SKILL.md), [research](../research/SKILL.md),
[grill-with-docs](../grill-with-docs/SKILL.md), [to-spec](../to-spec/SKILL.md),
and [to-plan](../to-plan/SKILL.md). Each skill owns its step; carry context
between them and keep artifacts in one `projects/<yyyy-mm-dd>-<slug>/` folder.
When PDD hands off an approved Design, skip to step 2 (Research); for any other
invocation, start at Bootstrap. Once the project folder exists, pass its path
to each skill. For `github` or an issue reference (`#<n>` or URL), read and
follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and
Issue Artifacts instead of `projects/`.

**Stop and ask:** If a skill reports a gap or the design does not make sense,
tell the user and wait. Do not fill the gap with a guess.

1. **Bootstrap.** Use agents-md to put project instructions in place. Take the
   idea from the user's message or this session's discussion; if neither has
   one, ask what to build. If the idea is vague, use
   [clarify](../clarify/SKILL.md). Continue when you know what to build and
   why.
2. **Research.** Use [research](../research/SKILL.md) on the idea, scoped to the
   project folder. Ask whether to research another topic or move on. Continue
   when the user is ready to grill.
3. **Grill.** Use [grill-with-docs](../grill-with-docs/SKILL.md) to
   stress-test the researched idea until the user confirms shared
   understanding. Do not write the spec yet.
4. **Spec.** Use [to-spec](../to-spec/SKILL.md) with the aligned idea and
   research. If grilling began from an existing draft, update `spec.md` with
   confirmed changes. Then have a separate read-only reviewer follow the
   [critique skill](../critique/SKILL.md) on the spec. Resolve agreed findings
   and repeat the critique after material changes. Continue when `spec.md` is
   written and its critique is resolved. Do not plan or implement before
   alignment is confirmed.
5. **Plan.** Use [to-plan](../to-plan/SKILL.md) with the spec, then critique
   the completed plan with a separate read-only reviewer following the
   [critique skill](../critique/SKILL.md). Resolve agreed findings and repeat
   after material changes. Then use [to-adr](../to-adr/SKILL.md) on the plan.
   If it writes no ADR, note why in the plan's Notes. Unless the project
   started from a PDD Design, offer [to-prd](../to-prd/SKILL.md) for
   stakeholder framing; run it only if the user wants it. Finish when each
   slice has the acceptance verification contract required by to-plan, and
   the critiques, ADRs, and PRD are settled. This ends planning, not
   implementation or passing acceptance tests.
6. **Hand off.** Ask the user to choose one next step, and start only that one:
   - Execute the plan with the execute-plan skill, or by hand: tell the user to
     run `/to-tasks <plan-path> slice-1` (`/to-tasks <plan-path>` for a
     single-slice plan).
   - Research another topic: return to step 2.
   - Write another plan: return to step 5.
