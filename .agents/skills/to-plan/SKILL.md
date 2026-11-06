---
name: to-plan
description: >-
  Write an implementation plan of slices and milestones from a spec or a
  session's discussion. Use when creating a feature plan, saving a plan
  discussed in chat, or when another skill needs a plan.
argument-hint: "[source path | github | #<issue>]"
metadata:
  model-tier: complex
---

Turn a source and, when available, its spec into `plan.md`: ordered vertical
slices, their outcomes, dependencies, exact shared interfaces, milestones,
and acceptance checks. Plan outcomes, not implementation tasks; the to-tasks
skill turns one slice at a time into tasks against live code. Write the plan;
don't build it.

**Stop and ask.** Follow the source as given. If information is missing,
contradictory, or points to a wrong design, tell the user and wait. Do not fill
gaps with guesses.

**Source.** Use the file named by the user or calling skill. If none is named,
use this session's discussion and capture the plan already worked out. For
`github` or an issue reference (`#<n>` or URL), read and follow
[GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and Issue
Artifacts instead of `projects/`. Use a
spec named by the user or caller, or `spec.md` in the source's project folder.
Plan without a spec only when neither exists. If the source names a spec you
cannot find, ask for its path. Without a spec, preserve the build request and
clarifications in Notes as quotations or fixed-revision document links; redact
secrets.

**Workflow.**

1. Read the source and determine whether a spec applies.
2. Read the spec, living features it names, linked research, and code the plan
   will change. Load convention skills for every language used by the planned
   signatures. Know the existing interfaces before slicing work.
3. Design vertical slices using [PLAN-GUIDE.md](references/PLAN-GUIDE.md).
   Follow its rules and template, including its conditional reads.
4. Write `plan.md` in the spec's project folder, or create
   `projects/<yyyy-mm-dd>-<slug>/` if there is no spec. Before drafting the
   Summary and slice outcomes, read [voice-product](../voice-product/SKILL.md).
   Set Status to `Planning`; fill Author and Created using
   `git config user.name` and
   `date +%F`. Write the Summary and each slice's Delivers in the
   voice-product style, so readers know what is built, for whom, and why.
   Before adding the plan to an index, read
   [PROJECTS-README.md](../shared/PROJECTS-README.md), then add it to the
   project README as described there.
5. Before handoff, read
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md) and have a
   fresh read-only reviewer compare the preserved build request and
   clarifications with the spec and plan. Check omissions, contradictions, and
   unexplained exclusions; keep proposed risk responses separate from agreed
   requirements. Correct clear omissions within existing authorization; ask
   about scope changes or ambiguity. Record the review in Notes. If delegation
   or the original build request is unavailable, inspect what is available and
   record the limitation. Repeat only if the brief, acceptance criteria, or
   milestone mapping changes.

**Done when** coverage is checked or its limits are recorded, discrepancies
are resolved, and the user has the plan path.
