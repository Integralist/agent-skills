---
name: redesign
description: >-
  Audit a feature, subsystem, or whole codebase and plan how to rebuild it
  more simply, with behaviour pinned by tests before any structural change.
  Use when asked how something would be built differently if started over,
  for a refactoring or redesign plan, or what to restructure or delete.
disable-model-invocation: true
argument-hint: "[--scope=<feature|subsystem|path>] [steering]"
metadata:
  model-tier: frontier
---

Audit a feature, subsystem, or codebase asking: *knowing what we know now,
how would we build it, and what could we delete?* Prefer deletion and
structural simplification over tidying up the same messy design. Write a
plan only—edit no code and give no PR verdict.

1. **Set the scope.** With `--scope=<feature|subsystem|path>`, treat a
   feature name (`auth-middleware`) as a feature and a subsystem/path (`api`)
   as a subsystem; with no `--scope`, audit the whole codebase (slug
   `codebase`). Ask if ambiguous. Identify the scoped files, primary language,
   and a kebab-case slug.
2. **Gather context and run read-only audits.** Collect the repo metadata
   snapshot by reading and following [git-metadata](../git-metadata/SKILL.md)
   and read
   [SUBAGENTS.md](references/SUBAGENTS.md). Run the applicable read-only
   review lenses (in parallel subagents for larger scopes, following
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md) for model
   tiers and completion checks—use judgment-tier for Structure). Finish only
   when every required audit has returned.
3. **Synthesize the redesign.**
   - Target root causes, not symptoms; rank cross-cutting simplifications
     first and call out any missed dramatic simplification plainly.
   - Define the target decomposition, prerequisite build order, and what to
     keep vs. rewrite/delete.
   - Cross-check each restructure target against the test coverage map: tag
     untested boundaries `BLOCKED-ON-TESTS` with the pinning tests needed
     (soft gate—ship the plan with the risk explicit).
   - Pin seams that survive the redesign rather than shallow modules being
     deleted, using dependency categories in
     [DEEPENING.md](../code-module-design/references/DEEPENING.md).
4. **Write findings.** Follow
   [FINDINGS-TEMPLATE.md](references/FINDINGS-TEMPLATE.md) and write
   `projects/<yyyy-mm-dd>-redesign-<slug>/redesign.md`.
5. **Create the implementation plan.** Read and follow
   [to-plan](../to-plan/SKILL.md)
   with `redesign.md` as source and write `plan.md` beside it, requiring:
   - **Slice 1** pins existing behaviour with characterization tests for each
     touched boundary (explicitly noting this documented exception to
     red-first TDD, since pinning tests pass against current code).
   - Every restructure slice depends on Slice 1 (still tagging any remaining
     untested boundary `BLOCKED-ON-TESTS`).
   - Reimplement cleanly rather than incrementally patching, and end with a
     slice verifying behavioural invariants and reduced complexity.

   Report both paths and a short summary.
6. **Surface durable rules.** Read and follow
   [durable-rules](../durable-rules/SKILL.md).
