---
name: redesign
description: >-
  Audit a whole codebase or subsystem for redesign opportunities and write a
  phased redesign plan that pins behaviour with tests before any structural
  change. Use when asked what to restructure or delete across a codebase,
  rather than in one feature or one diff.
disable-model-invocation: true
metadata:
  model-tier: frontier
---

# Redesign

Audit the current state of a codebase or subsystem and ask: knowing what we
know now, if we started over, how would we build this, and what could we
delete entirely? Four read-only subagents look at structure, standards
drift, purpose drift, and test coverage; you synthesise their findings into
a plan. Be direct and demanding: name a missed dramatic simplification
plainly rather than softening it into a suggestion. This skill writes a plan
only; it edits no code and gives no PR verdict. For one feature, use the
refactor skill; for a diff, code-review; for AI slop, cleanup.

1. **Set the scope.** With no argument, audit the whole codebase, slug
   `codebase`. With a subsystem name or path (such as `api` or `auth`),
   audit that, slugged in kebab case. Done when you have the scope, its file
   list, and the slug.
2. **Gather context** for every subagent prompt:
   - project metadata from the commands in
     [git-metadata](../git-metadata/SKILL.md);
   - the primary language: Go if there's a root `go.mod`, TypeScript if
     `package.json` lists `typescript` or there are `.ts` files, otherwise by
     file extension;
   - the standards and purpose sources listed under subagents 2 and 3.

   Done when all three are collected.
3. **Spawn the four subagents** below in one message, in parallel, on the
   cheapest adequate model, following
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md), including
   its completion and retry protocol. Give each the metadata, the language,
   the file list, its brief, and the instruction that it reports findings
   only, editing no code and running nothing that changes state. Done when
   all four have returned.
4. **Synthesise** a redesign strategy:
   - Rank findings that hit several axes first: a restructure that also
     fixes a standards breach and a purpose drift tops the list.
   - Prefer findings that delete complexity to ones that rearrange it, and
     name the root design issue rather than its symptom.
   - Check every restructure target against subagent 4's coverage map. Tag a
     target whose boundary lacks tests `BLOCKED-ON-TESTS`, listing the
     pinning tests it needs. This is a soft gate: the plan still ships, with
     the risk explicit.

   Done when every finding is ranked and every target is pinned or tagged.
5. **Write the plan** with
   [REIMPL-PLAN-TEMPLATE.md](../shared/REIMPL-PLAN-TEMPLATE.md), which holds
   the output path and base writing rules. Substitute `Redesign` for
   `{Plan Type}`, the subsystem or `codebase` for `{Scope Name}`, `redesign`
   for `{plan-type}`, and the slug for `{slug}`, and fill the insertion
   points as described under **Plan additions**. Done when the plan is
   written.
6. **Surface durable rules** by following
   [durable-rules](../durable-rules/SKILL.md). Done when it's run.

## Subagents

**1. Aspirational structure.** The heart of the skill: restructurings that
delete whole categories of complexity, not rearrange them. Include the
code-judo brief from [CODE-JUDO.md](../shared/CODE-JUDO.md) verbatim, then
this:

````md
Flag only these measurable triggers, not "looks off" impressions:

- A file over 1000 lines: propose a decomposition.
- A function over 50 lines doing several things: propose extraction.
- Wrapper or identity functions that forward arguments without validating,
  defaulting, or transforming them; thin pass-through helpers.
- Loose type boundaries: a value typed as the language's escape hatch
  (`any`/`interface{}` in Go, `any`/`unknown` in TypeScript, `Object` in
  Java/C#, dynamic dispatch in Python) and immediately narrowed by an
  assertion or runtime check.
- Feature conditionals spread across more than one file in shared paths
  instead of behind a dedicated abstraction.
- Near-duplicates of an existing canonical helper.
- Switch or if chains of more than 5 arms on one discriminant: a missing
  dispatch table, polymorphic type, or state machine.
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

Group findings by severity. Each gives file and approximate lines, the
trigger, why it matters (impact, not aesthetics), and a concrete remedy:
delete X, reframe Y, extract Z.
````

**2. Standards drift.** Pass it the list of standards sources: `CLAUDE.md`,
`AGENTS.md`, and `CONTRIBUTING.md` at the root and in subdirectories;
`STYLE.md`, `STANDARDS.md`, or `STYLEGUIDE.md` at the root or under `docs/`;
`docs/adr/**/*.md`; package READMEs that document conventions; and
`.editorconfig`, `.eslintrc.*`, `biome.json`, `prettier.config.*`, and
`tsconfig.json`, so it can skip what tooling enforces. For Go only, add
[conventions-go](../conventions-go/SKILL.md) and, for an HTTP service, its
[SERVICE-ARCHITECTURE.md](../conventions-go/references/SERVICE-ARCHITECTURE.md),
which are authoritative for Go audits.

````md
Read all the standards sources first, then scan the code and report where it
breaks a documented standard, citing the file and rule for each. Separate
hard violations (a clear rule, clearly broken) from judgement calls. Skip
anything tooling already enforces; focus on what humans must catch.
````

**3. Purpose drift.** Its sources are the top-level and per-module READMEs,
`docs/**/*.md` (especially PRDs, specs, and designs), and package metadata
such as the `package.json` description, `go.mod` module path, or
`Cargo.toml` description. If the scope has no purpose docs, it reports "no
purpose docs found" and the synthesis skips it.

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
Map the codebase's behavioural coverage; judge test quality only when it's
egregious, such as tests that assert nothing. For each major boundary (public
API, package boundary, integration point), report the behaviours tests cover
(citing test names and files), public APIs with no tests, untested error
paths, untested concurrency or lifecycle behaviour, and integration points
with no end-to-end coverage. Tag each finding with its boundary.
````

## Plan additions

**Phase 0 and test-first rules.** Phase 0's characterization tests pass by
construction, pinning existing behaviour so the redesign can't silently
change it. If the project's `CLAUDE.md` or equivalent says "no code without a
failing test", they're the documented exception, and the plan says so, so a
downstream agent doesn't reject Phase 0.

At `extra metadata bullets`:

````md
- **Scope**: codebase | <subsystem path>
````

At `findings / analysis sections`, between Current State and What We Should
Have Done First:

````md
## Findings

### Aspirational Structure

{Subagent 1's findings by severity. Each: file:line, trigger, impact,
concrete remedy.}

### Standards Drift

{Subagent 2's findings. Each cites the standard (file and rule).}

### Purpose Drift

{Subagent 3's findings. Each quotes the doc line.}

### Test Coverage

{Subagent 4's coverage map, focused on boundaries the redesign touches.}

## Cross-Cutting Wins

{Findings that resolve several axes; these go first.}

## Behavioral Invariants

{The behaviours the redesign must preserve, from purpose docs and existing
tests. This is the post-redesign verification target.}
````

At `pre-prerequisite phases`, before Phase 1:

````md
> [!IMPORTANT]
> Phase 0 contains characterization tests that pin existing behavior.
> These tests **pass by construction** — this is the documented exception
> to the "no code without a failing test" rule. No Phase 1+ task targeting
> a boundary may proceed before its Phase 0 pinning tests land.

### Phase 0: Test Pinning

- [ ] **Task 0.1**: Pin {boundary X} with characterization tests.

  {What behaviors to capture. Test file path. Reference the public API
  and error paths from the coverage audit.}

  ```{language}
  // Example pinning test signature
  ```
````

Each Phase 2 task cites its pinning, `Pinned by: Phase 0 tasks {0.x, 0.y}.`,
or, where the boundary still lacks coverage,
`BLOCKED-ON-TESTS: needs {specific missing tests}.`

Replace the template's verification phase with:

````md
### Phase N: Verification

- [ ] **Task N.1**: Run all Phase 0 pinning tests — must still pass.
- [ ] **Task N.2**: Confirm every behavioral invariant from the section
  above still holds.
- [ ] **Task N.3**: Verify complexity reduction — file/function size
  metrics, layer-leak count, branching count.
````

At `trailing sections`, after File Changes:

````md
## Approval Bar

This plan treats the following as presumptive blockers — if any survive
into the implementation, justify them explicitly:

- A code-judo move that would delete incidental complexity is left on
  the table.
- A file >1000 lines is preserved or made larger without strong reason.
- Feature logic remains scattered across shared modules.
- Unnecessary abstractions, wrappers, or escape-hatch-typed contracts
  remain.
- A near-duplicate of an existing canonical helper is kept.
````

List every `BLOCKED-ON-TESTS` task in Notes & Caveats too.
