---
name: redesign
description: >-
  Audit a feature, subsystem, or whole codebase and plan how to rebuild it
  more simply, with behaviour pinned by tests before any
  structural change. Use when asked how something would be built differently
  if started over, for a refactoring or redesign plan, or what to restructure
  or delete.
disable-model-invocation: true
argument-hint: "[feature, subsystem, or path; empty for the whole codebase]"
metadata:
  model-tier: frontier
---

Audit a feature, subsystem, or codebase and ask: knowing what we know now,
how would we build it, and what could we delete? Read-only subagents audit
the scope; synthesise their findings into a redesign and hand it to to-plan.
The plan's first slice pins existing behaviour with tests. Prefer deletion
over rearrangement. Name a missed dramatic simplification plainly.

This skill writes a plan only: it edits no code and gives no PR verdict. Use
improve-codebase-architecture to explore deepening opportunities before
choosing a target, code-review for a diff, and cleanup for AI slop.

1. **Set the scope.** A feature name (for example `auth-middleware`) is a
   feature; a subsystem name or path (for example `api`) is a subsystem. No
   argument means the whole codebase, with slug `codebase`. Ask if it's
   unclear whether the input names a feature or subsystem. Identify the file
   list and a kebab-case slug.
2. **Gather audit context.** Read
   [SUBAGENTS.md](references/SUBAGENTS.md) for audit briefs and scope-specific
   sources. Gather the project metadata snapshot using
   [git-metadata](../git-metadata/SKILL.md). Detect the primary language: Go
   if the root has `go.mod`; TypeScript if `package.json` lists `typescript`
   or any `.ts` files exist; otherwise use file extensions. Collect everything
   before drafting prompts.
3. **Run the audits.** Read [SUBAGENTS.md](references/SUBAGENTS.md) for which
   reviewers to spawn and prompt requirements. Spawn the applicable read-only
   subagents together in one message, in parallel, on the cheapest
   adequate model. Each reports findings only: no code edits or state-changing
   commands. Follow
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md), including
   its completion and retry protocol. Finish only when every required
   subagent has returned.
4. **Synthesize the redesign.**
   - Name root causes, not symptoms. Prefer findings that delete complexity
     over rearranging it.
   - Rank findings affecting several axes first. A restructure that also
     fixes a standards breach and purpose drift leads the list.
   - Describe the ideal decomposition, build order with prerequisites first,
     and what to keep versus rewrite.
   - Check each restructure target against the coverage map from subagent 4.
     Tag targets whose boundary lacks tests `BLOCKED-ON-TESTS`, and list the
     pinning tests needed. This is a soft gate: ship the plan with the risk
     explicit.
   - Pin seams that survive the redesign, not shallow modules it removes.
     Choose how each pin crosses its seam using the dependency categories in
     [DEEPENING.md](../code-module-design/references/DEEPENING.md).
5. **Write the findings.** Before writing, read
   [FINDINGS-TEMPLATE.md](references/FINDINGS-TEMPLATE.md) for the output
   path and writing rules. Create
   `projects/<yyyy-mm-dd>-redesign-<slug>/redesign.md`.
6. **Create the implementation plan.** Use the to-plan skill with
   `redesign.md` as source and write `plan.md` beside it. Require that:
   - Slice 1 pins existing behaviour with characterization tests for each
     touched boundary. These tests pass against today's code by construction;
     the plan must state this documented exception to any "no code without a
     failing test" rule.
   - Every restructure slice depends on Slice 1. If its boundary still lacks
     tests, mark it `BLOCKED-ON-TESTS` and name the needed tests.
   - The plan reimplements rather than incrementally patches, and ends with
     a slice checking behavioural invariants and reduced complexity (file and
     function sizes, layer leaks, branching).

   Report both paths and a short summary.
7. **Surface durable rules.** Follow
   [durable-rules](../durable-rules/SKILL.md).
