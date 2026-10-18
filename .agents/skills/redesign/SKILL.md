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

# Redesign

Audit the current state of a feature, subsystem, or codebase and ask: knowing
what we know now, if we started over, how would we build this, and what could
we delete entirely? Read-only subagents audit it; you synthesise their
findings and hand them to the to-plan skill for a plan whose first slice
pins existing behaviour with tests. Aim for deletions, not rearrangements, and be direct: name a missed
dramatic simplification plainly rather than softening it into a suggestion.
This skill writes a plan only; it edits no code and gives no PR verdict. To
hunt for deepening opportunities before you've picked a target, use
improve-codebase-architecture; for a diff, code-review; for AI slop, cleanup.

1. **Set the scope.** A feature name (such as `auth-middleware`) is a
   feature scope; a subsystem name or path (such as `api`) is a subsystem
   scope; no argument audits the whole codebase, slug `codebase`. Ask which
   it is if the argument could be either. Done when you have the scope, its
   file list, and a kebab-case slug.
2. **Gather context** for every subagent prompt: project metadata from the
   commands in [git-metadata](../git-metadata/SKILL.md), and the primary
   language (Go if there's a root `go.mod`, TypeScript if `package.json`
   lists `typescript` or there are `.ts` files, otherwise by file
   extension). Collect the standards sources listed under subagent 2, and
   for a subsystem or codebase the purpose sources under subagent 3. Done
   when all of it is collected.
3. **Spawn the subagents** below in one message, in parallel, on the
   cheapest adequate model, following
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md), including
   its completion and retry protocol. A feature gets subagents 1, 2, and 4;
   a subsystem or codebase gets all four. Give each the metadata, the
   language, the file list, its brief, and the instruction that it reports
   findings only, editing no code and running nothing that changes state.
   Done when every subagent has returned.
4. **Synthesise** a redesign strategy:
   - Name root causes, not symptoms, and prefer findings that delete
     complexity to ones that rearrange it.
   - Rank findings that hit several axes first: a restructure that also
     fixes a standards breach and a purpose drift tops the list.
   - Lay out the ideal decomposition, the build order with prerequisites
     first, and what to keep versus rewrite.
   - Check every restructure target against subagent 4's coverage map. Tag
     a target whose boundary lacks tests `BLOCKED-ON-TESTS`, listing the
     pinning tests it needs. This is a soft gate: the plan still ships, with
     the risk explicit.
   - Pin at seams that survive the redesign, not at shallow modules it
     removes, and choose how each pin crosses its seam by the dependency
     categories in
     [DEEPENING.md](../code-module-design/DEEPENING.md).

   Done when every finding is ranked and every target is pinned or tagged.
5. **Write the findings** with [FINDINGS-TEMPLATE.md](FINDINGS-TEMPLATE.md),
   which holds the output path and writing rules. Done when `redesign.md` is
   written.
6. **Plan it** with the to-plan skill, using `redesign.md` as the source and
   writing `plan.md` beside it. Tell it:
   - Slice 1 pins existing behaviour: its milestones are characterization
     tests for each boundary the redesign touches. They pass against today's
     code by construction, which makes them the documented exception to any
     "no code without a failing test" rule, and the plan says so.
   - Every restructure slice is blocked by Slice 1. A slice whose boundary
     still lacks tests says `BLOCKED-ON-TESTS` and names the tests it needs.
   - Plan a reimplementation, not incremental patches, and end with a slice
     that checks the behavioural invariants still hold and complexity fell
     (file and function sizes, layer leaks, branching).

   Done when `plan.md` is written and you've given both paths and a short
   summary.
7. **Surface durable rules** by following
   [durable-rules](../durable-rules/SKILL.md). Done when it's run.

## Subagents

**1. Structure.** The heart of the skill: restructurings that delete whole
categories of complexity, not rearrange them. Include the code-judo brief
from [CODE-JUDO.md](../shared/CODE-JUDO.md) verbatim and the path to
[code-module-design](../code-module-design/SKILL.md), telling it to use
that vocabulary and apply the deletion test to anything shallow, then this:

````md
Map the implementation first: the files, types, and interfaces involved, the
data and control flow end to end, and which packages own which
responsibilities. Then flag only these measurable triggers, not "looks off"
impressions:

- A file over 1000 lines: propose a decomposition.
- A function over 50 lines doing several things, nesting over 3 levels, or
  taking more than 4 parameters: propose extraction.
- Shallow modules: wrapper or identity functions that forward arguments
  without validating, defaulting, or transforming them; interfaces nearly as
  large as the logic behind them; callers coordinating several low-level
  helpers instead of one deep entry point, or importing types the module
  should keep private.
- Fragmentation: one concern scattered across packages.
- Near-duplicates of an existing canonical helper.
- Loose type boundaries: a value typed as the language's escape hatch
  (`any`/`interface{}` in Go, `any`/`unknown` in TypeScript, `Object` in
  Java/C#, dynamic dispatch in Python) and immediately narrowed by an
  assertion or runtime check.
- Feature conditionals spread across more than one file in shared paths
  instead of behind a dedicated abstraction.
- Switch or if chains of more than 5 arms on one discriminant: a missing
  dispatch table, polymorphic type, or state machine.
- Coupling: circular or upward dependencies, shared mutable state or
  globals, or concrete types where an interface would decouple.
- Sequential `await` or `go func()` chains over independent work, where
  parallelism would also simplify the code.
- Logic in the wrong layer: feature logic in shared utilities, or storage
  details leaking into handlers.
- Related state updates that can leave the system half-applied when a more
  atomic structure is obvious.

Prefer remedies that delete a layer of indirection, reframe the state model
so conditionals disappear, move the ownership boundary so the feature
extends an existing abstraction, turn special cases into a simpler default
flow, replace condition chains with a typed model or dispatcher, collapse
duplicate branches, reuse the canonical helper, move logic to the layer that
owns the concept, parallelise independent work, or make related updates
atomic. A rename is not a remedy for a structural problem, and neither is a
tidier version of the same messy idea when a much simpler one is plausible.

Report:

1. The implementation map.
2. Findings grouped by severity, each with file and approximate lines, the
   trigger, why it matters (impact, not aesthetics), and a concrete remedy:
   delete X, reframe Y, extract Z.
3. Missing prerequisites: interfaces, shared types, test fakes, or decisions
   that should have existed before this code was built.
4. The key insight: the single change that makes the most complexity
   vanish.
````

**2. Standards and precedent drift.** Pass it the path to the
[precedent](../precedent/SKILL.md) skill and the list of
standards sources: `CLAUDE.md`, `AGENTS.md`, and `CONTRIBUTING.md` at the
root and in subdirectories; `STYLE.md`, `STANDARDS.md`, or `STYLEGUIDE.md` at
the root or under `docs/`; `docs/adr/**/*.md`; package READMEs that document
conventions; and `.editorconfig`, `.eslintrc.*`, `biome.json`,
`prettier.config.*`, and `tsconfig.json`, so it can skip what tooling
enforces. For Go only, add [conventions-go](../conventions-go/SKILL.md) and,
for an HTTP service, its
[SERVICE-ARCHITECTURE.md](../conventions-go/references/SERVICE-ARCHITECTURE.md),
which are authoritative for Go audits.

````md
Read all the standards sources first, then scan the code and report where it
breaks a documented standard, citing the file and rule for each. Separate
hard violations (a clear rule, clearly broken) from judgement calls. Skip
anything tooling already enforces; focus on what humans must catch.

Then, for patterns no standard writes down, follow steps 1 and 2 of the
precedent skill: find each file's peers and compare them on every axis that
applies. Report a divergence only with at least two peer citations, skip
cosmetic one-offs, and rank by blast radius, so patterns other code will
copy come first. Report only; apply nothing.
````

**3. Purpose drift** (subsystem or codebase). Its sources are the top-level
and per-module READMEs, `docs/**/*.md` (especially PRDs, specs, and designs),
and package metadata such as the `package.json` description, `go.mod` module
path, or `Cargo.toml` description. If the scope has no purpose docs, it
reports "no purpose docs found" and the synthesis skips it.

````md
Read the stated-purpose docs first, then the code, and report:

1. **Vestigial features:** documented as core, but abandoned, with no recent
   commits or no callers.
2. **Scope creep:** significant code no doc gives a purpose for, such as
   unsanctioned features, dead-end experiments, or undocumented expansion.
3. **Doc and code divergence:** what the docs say against what the code
   does.

Quote the doc line for each finding.
````

**4. Test coverage.** A redesign without a behavioural safety net is a rewrite
from memory. Its sources are the test files (`*_test.go`, `*.test.ts`,
`tests/**`, `__tests__/**`), any coverage reports (`coverage.out`,
`lcov.info`, `coverage.xml`), and CI config (`.github/workflows/**`,
`.gitlab-ci.yml`, `Makefile`) showing which suites actually run.

````md
Map the behavioural coverage of the code in scope; judge test quality only
when it's egregious, such as tests that assert nothing. For each major
boundary (public API, package boundary, integration point), report the
behaviours tests cover (citing test names and files), public APIs with no
tests, untested error paths, untested concurrency or lifecycle behaviour, and
integration points with no end-to-end coverage. Tag each finding with its
boundary.
````
