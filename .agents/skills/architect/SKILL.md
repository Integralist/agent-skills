---
name: architect
description: >-
  Take a feature from an idea through research, grilling, a spec, and a plan.
  Use when architecting a feature from an idea or this session's discussion,
  or exploring a design before planning.
argument-hint: >-
  [--next [#<issue> | URL | <project-path>]] [--github] [steering]
metadata:
  model-tier: complex
---

Coordinate a feature through skills in order:
[agents-md](../agents-md/SKILL.md), [research](../research/SKILL.md),
[grill-with-docs](../grill-with-docs/SKILL.md), [to-spec](../to-spec/SKILL.md),
and [to-plan](../to-plan/SKILL.md), invoking [spike](../spike/SKILL.md) only
when an empirical unknown passes its initiation gate. Each skill owns its
step; carry context between them and keep artifacts in one
`projects/<yyyy-mm-dd>-<slug>/` folder (or one Root Project Issue in GitHub
mode). When PDD hands off an approved Design, carry the same project folder
or `#<issue>` forward and skip to step 2 (Research). Otherwise, honor an
explicitly requested starting step in the user's steering text; if none is
given, start at Bootstrap. Once the workspace exists, pass its project path or
`#<issue>` to each skill. `--github` selects GitHub Issues and Issue Artifacts
instead of `projects/`; an issue reference (`#<n>` or URL) selects the same
mode. For `--github` or an issue reference (`#<n>` or URL), read and follow
[GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md).

**Resume with `--next`.** Pass `--next` in any position to continue an
existing flow instead of starting over. Resolve the supplied issue reference
or project directory, or use this session's active project; an issue
reference selects GitHub mode. A project path identifies the on-disk project
directory (for example, `projects/<yyyy-mm-dd>-<slug>/`). For GitHub, follow
[GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to inspect the Root Issue and
its artifacts read-only. For an on-disk project, inspect its README and
artifacts. Compare that evidence with the completion conditions below. Tell
the user the last completed step, the evidence, and the exact next step, then
ask whether to continue. Start only after confirmation, carrying the same
workspace and mode into that step. If the project or handoff state is unclear,
explain what you found and ask where to resume. If all steps are complete,
offer the handoff choices in step 6.

**Stop and ask:** If a skill reports a gap or the design does not make sense,
tell the user and wait. Do not fill the gap with a guess.

1. **Bootstrap.** Use agents-md to put project instructions in place. Take the
   idea from the user's message or this session's discussion; if neither has
   one, ask what to build. If the idea is vague, use
   [clarify](../clarify/SKILL.md). Continue when you know what to build and
   why. Carry the original request and later clarifications into downstream
   steps, not just a summary.
2. **Research.** Use [research](../research/SKILL.md) on the idea, scoped to the
   project folder. For runnable applications, inspect existing local-running
   commands, dependencies, upstream contracts, and integration-test tooling.
   Present a [summarize](../summarize/SKILL.md)-style digest
   in chat (bottom line, <= 5 key findings, one next step) and ask whether to
   research more, run a [spike](../spike/SKILL.md) (only if an unresolved
   unknown passes its initiation gate), or grill. If a spike runs, record its
   verdict in `research.md` and discard spike code before grilling.
3. **Grill.** Use [grill-with-docs](../grill-with-docs/SKILL.md) to
   stress-test the researched idea until the user confirms shared
   understanding. For runnable applications, agree the local-running and
   end-to-end integration-test scope: real dependencies, mocked upstreams,
   contract sources, and any exceptions. Carry these decisions into the spec
   and plan, including when starting at a later step.
   If grilling uncovers an empirical unknown that passes the
   [spike](../spike/SKILL.md) initiation gate, pause to run the spike and
   bring its verdict back before continuing. Do not write the spec yet.
4. **Spec.** Use [to-spec](../to-spec/SKILL.md) with the aligned idea,
   research, and preserved request/history (`intent.md` when present). Update
   `spec.md` if grilling started from a draft. When a decision changes, update
   every artifact that restates it. Have a separate read-only reviewer, on a
   different model family where available, run [critique](../critique/SKILL.md)
   on `spec.md` against the records it cites, resolve agreed findings, then
   run [distill](../distill/SKILL.md) (`--prune`) to strip accumulated
   repetition and caveats before handoff. Present a short
   [summarize](../summarize/SKILL.md)-style digest in chat. Do not plan or
   implement before alignment is confirmed.
5. **Plan.** Use [to-plan](../to-plan/SKILL.md) with the spec and preserved
   intent, then have a separate read-only reviewer, on a different model
   family where available, run [critique](../critique/SKILL.md) on the plan
   against the spec and the records it cites. Resolve agreed findings, then
   run [distill](../distill/SKILL.md) (`--prune`) so slice summaries stay
   within [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md) budgets and shared
   sections are linked, not copied. Run [to-adr](../to-adr/SKILL.md) on the
   plan (noting in Notes if none qualify) and offer [to-prd](../to-prd/SKILL.md)
   for stakeholder framing. Finish when each slice has the acceptance
   verification contract required by to-plan, including applicable local-running
   coverage, and the critiques, ADRs, and PRD
   are settled—this ends planning, not implementation or passing acceptance
   tests. Present a short [summarize](../summarize/SKILL.md)-style digest in
   chat when planning ends.
6. **Hand off.** Ask the user to choose one next step, and start only that one:
   - Execute the plan with the execute-plan skill, or by hand: tell the user to
     run `/to-tasks <plan-path> --slice=1` (`/to-tasks <plan-path>` for a
     single-slice plan). For GitHub, use the Root Issue:
     `/to-tasks #123 --slice=1` (`/to-tasks #123` for a single-slice plan).
   - Research another topic: return to step 2.
   - Write another plan: return to step 5.
