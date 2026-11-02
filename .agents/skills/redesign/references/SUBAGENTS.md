# Redesign Subagent Briefs

For a feature, use reviewers 1, 2, and 4; for a subsystem or codebase, use all
four. Give each reviewer the collected metadata snapshot, primary language,
scoped file list, and its brief. Require findings only: no code edits or
commands that change state.

## Subagents

**1. Structure.** The heart of the skill: restructurings that delete whole
categories of complexity, not rearrange them. Include the code-judo brief
from [CODE-JUDO.md](../../shared/CODE-JUDO.md) verbatim and the path to
[code-module-design](../../code-module-design/SKILL.md), telling it to use
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
[precedent](../../precedent/SKILL.md) skill and the list of
standards sources: `CLAUDE.md`, `AGENTS.md`, and `CONTRIBUTING.md` at the
root and in subdirectories; `STYLE.md`, `STANDARDS.md`, or `STYLEGUIDE.md` at
the root or under `docs/`; `docs/adr/**/*.md`; package READMEs that document
conventions; and `.editorconfig`, `.eslintrc.*`, `biome.json`,
`prettier.config.*`, and `tsconfig.json`, so it can skip what tooling
enforces. For Go only, add [conventions-go](../../conventions-go/SKILL.md) and,
for an HTTP service, its
[SERVICE-ARCHITECTURE.md](../../conventions-go/references/SERVICE-ARCHITECTURE.md),
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
