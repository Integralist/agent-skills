---
name: architect
description: >-
  Take a feature from an idea through research, grilling, a spec, and a plan.
  Use when architecting a feature from an idea or this session's discussion,
  or exploring a design before planning.
argument-hint: "[--next[=<#issue|url|path>]] [--github] [steering]"
metadata:
  model-tier: complex
---

Coordinate a feature through skills in order:
[agents-md](../agents-md/SKILL.md), [clarify](../clarify/SKILL.md),
[research](../research/SKILL.md),
[grill-with-docs](../grill-with-docs/SKILL.md), [to-spec](../to-spec/SKILL.md),
and [to-plan](../to-plan/SKILL.md), invoking [spike](../spike/SKILL.md) only
when an empirical unknown passes its initiation gate. Keep all artifacts in
one `projects/<yyyy-mm-dd>-<slug>/` folder. For `--github` or an issue
reference (`#<n>` or URL), read and follow
[GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) instead of `projects/`.

Start at Bootstrap unless the user names a later step, or PDD hands off an
approved Design (carry the same workspace forward and start at Research). Once
the workspace exists, pass its path or `#<issue>` to each downstream skill.

**Resume with `--next[=<#issue|url|path>]`.** Resolve the named issue/path or active session
workspace, inspect its artifacts read-only (via `GITHUB-ISSUES.md` for GitHub,
or its README/files on disk), and compare with the completion conditions
below. Report the last completed step, evidence, and exact next step, and
wait for confirmation before continuing. If state is unclear, ask where to
resume; if all steps are complete, offer step 7's handoff choices.

**Stop and ask:** If a skill reports a gap or the design does not make sense,
tell the user and wait. Do not fill the gap with a guess.

1. **Bootstrap.** Read and follow [agents-md](../agents-md/SKILL.md) to ensure
   the repository's `AGENTS.md` is canonical and current (running its Update
   audit if `AGENTS.md` already exists) so downstream decisions rest on
   accurate project context.
2. **Clarify.** Take the idea from the message or session. If missing, ask;
   if under-specified, read and follow [clarify](../clarify/SKILL.md) before
   starting research. Carry the original request and later clarifications
   downstream, not just a summary. Outside `--github` mode, if still on the
   default branch of the main checkout, read and follow
   [worktree-create](../worktree-create/SKILL.md) so project artifacts live in
   a sibling worktree (unless the user prefers working in-place).
3. **Research.** Read and follow [research](../research/SKILL.md) scoped to
   the workspace. For runnable applications, inspect local-running commands,
   dependencies, upstream contracts, and integration-test tooling. Present a
   [summarize](../summarize/SKILL.md)-style digest in chat and ask whether to
   research more, read and follow [spike](../spike/SKILL.md) (only if an
   unknown passes its gate), or grill. Record any spike verdict in
   `research.md` and discard spike code before grilling.
4. **Grill.** Read and follow [grill-with-docs](../grill-with-docs/SKILL.md)
   until shared understanding is confirmed. For runnable applications, agree
   local-running and end-to-end integration-test scope (real dependencies,
   mocked upstreams, contract sources, exceptions) and carry those decisions
   into the spec and plan. Pause for [spike](../spike/SKILL.md) only if
   grilling surfaces an empirical unknown that passes its gate. Do not write
   the spec yet.
5. **Spec.** Read and follow [to-spec](../to-spec/SKILL.md) with the aligned
   idea, research, and preserved intent (`intent.md` when present); update
   `spec.md` if grilling started from a draft. Keep restated decisions synced
   across unapproved artifacts (record proposed changes separately for approved
   ones). For non-trivial specs, have a separate read-only reviewer (different
   model family when available) read and follow
   [critique](../critique/SKILL.md) against cited records and resolve agreed
   findings; read and follow [distill](../distill/SKILL.md) (`--prune`) only
   if revisions added bloat or repetition. Present a
   [summarize](../summarize/SKILL.md)-style digest in chat and wait for
   alignment before planning.
6. **Plan.** Read and follow [to-plan](../to-plan/SKILL.md) with the spec and
   preserved intent. For non-trivial plans, have a separate read-only
   reviewer (different model family when available) read and follow
   [critique](../critique/SKILL.md) against the spec and cited records,
   resolve agreed findings, and read and follow [distill](../distill/SKILL.md)
   (`--prune`) only if revisions added bloat or copied shared sections into
   slices. Read and follow [to-adr](../to-adr/SKILL.md) on the plan (note in
   Notes if none qualify) and offer [to-prd](../to-prd/SKILL.md) for
   stakeholder framing. Finish when each slice has the acceptance verification
   contract required by to-plan, including applicable local-running coverage,
   and critiques, ADRs, and PRD are settled—this ends planning, not
   implementation or passing acceptance tests. Present a short
   [summarize](../summarize/SKILL.md)-style digest in chat.
7. **Hand off.** Ask the user to choose one next step and start only that one:
   - Execute the plan with `execute-plan`, or by hand via
     `/to-tasks --plan=<plan-path> --slice=1` (or `/to-tasks --plan=<plan-path>`
     for one slice; `--plan=#<root-issue>` in GitHub mode).
   - Research another topic: return to step 3.
   - Write another plan: return to step 6.
