---
name: to-plan
description: >-
  Write an implementation plan of slices and milestones from a spec or a
  session's discussion. Use when creating a feature plan, saving a plan
  discussed in chat, or when another skill needs a plan.
argument-hint: "[--source=<path|#issue|url>] [--github] [steering]"
metadata:
  model-tier: complex
---

Turn a source and, when available, its spec into `plan.md`: ordered vertical
slices, outcomes, dependencies, exact shared interfaces, milestones, and
acceptance checks. Plan outcomes, not implementation tasks (`to-tasks`
compiles one slice at a time against live code). Write the plan; don't build
it.

**Stop and ask.** Follow the source as given. If information is missing,
contradictory, or points to a wrong design, tell the user and wait. Do not fill
gaps with guesses.

## Workflow

1. **Resolve source and workspace.** Use `--source=<path|#issue|url>` if
   given, or this session if omitted. For `--github` or an issue reference (`#<n>` or URL), read
   and follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) instead of
   `projects/`; also follow it when this session's active project is already
   tracked in GitHub Issues. Use the named spec or `spec.md` in the project
   folder (ask if
   a named spec is missing; plan without a spec only when neither exists).
   Read existing `intent.md`; before preserving request evidence or history,
   read [PROJECT-INTENT.md](../shared/PROJECT-INTENT.md) (without a spec, link
   the preserved source from Notes rather than embedding history).
2. **Read current code and specs.** Inspect the spec, living `.feature` files
   it names, linked research, and code the plan will touch. Load convention
   skills for every language used in planned signatures.
3. **Slice the work.** Design vertical slices using
   [PLAN-GUIDE.md](references/PLAN-GUIDE.md), following its rules, template,
   and conditional reads.
4. **Write `plan.md` (and any needed `intent.md`).** Read and follow
   [voice-product](../voice-product/SKILL.md) before drafting explanatory
   prose (Summary, slice outcomes, Notes, and `<details>`). Set Status
   `Planning`, Author (`git config user.name`), and Created (`date +%F`).
   Define lettered IDs or shorthand before first use and preserve exact
   contracts.

   - **On disk:** Write in the spec's project folder (or create
     `projects/<yyyy-mm-dd>-<slug>/`). Read
     [PROJECTS-README.md](../shared/PROJECTS-README.md) before indexing.
   - **GitHub:** Follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to
     publish `plan.md` as a Root Issue Artifact and update its index.
5. **Check intent coverage.** Read
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md) and have a
   fresh read-only reviewer compare `intent.md` (or preserved source) with
   the spec and plan, using the intent guide's handoff check. Keep proposed
   risk responses separate from agreed requirements; fix clear omissions
   within existing authorization, ask about scope changes or ambiguity, and
   record the review in Notes. If delegation or the original build request is
   unavailable, inspect what is available and record the limitation. Repeat
   only if the brief, acceptance criteria, or milestone mapping changes.
6. **Present a short [summarize](../summarize/SKILL.md)-style digest** (bottom
   line, slice count and gates, next step) rather than repeating plan prose.

**Done when** coverage is checked (or limits recorded), discrepancies are
resolved, and the user has the plan path and digest.
