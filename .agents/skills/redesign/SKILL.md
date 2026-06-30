---
name: redesign
description: >-
  Strategic codebase-wide audit for aspirational redesign
  opportunities. Hunts for "code judo" moves that delete whole
  categories of complexity, drift from documented standards,
  drift from stated purpose, and gaps in test coverage that
  would make a redesign unsafe. Produces a phased redesign plan
  with mandatory test-pinning before any structural change.
disable-model-invocation: true
---

# Redesign

Codebase-wide redesign audit. Wider than `refactor` (single feature), not a
diff review (`code-review`), not AI-slop cleanup (`cleanup`). Reviews the
*current state* and asks: **knowing what we know now, if we started over, how
would we do this differently — and what could we delete entirely?**

## Input

Detect scope from the argument and parse it into a kebab-case slug for the
output filename:

| Argument            | Scope                             | Slug         |
| ------------------- | --------------------------------- | ------------ |
| None                | Whole codebase                    | `codebase`   |
| Subsystem name/path | Scoped audit (e.g. `api`, `auth`) | kebab of arg |

## Gather project metadata

Load [`git-metadata/SKILL.md`](../git-metadata/SKILL.md), run its commands, and
include the output in every subagent prompt so each can prioritize empirically.

## Detect language

Detect the primary language before spawning subagents and pass the result to
each (it gates checks, and tells the Standards subagent whether to read the
user's Go conventions):

- Go — `go.mod` at repo root
- TypeScript/JavaScript — `package.json` with `typescript`, or `.ts` files
- Other — file-extension heuristics

## Spawn four parallel subagents

Spawn all four in a single message with parallel tool calls. All four are the
platform's `general-purpose` (workhorse) role. Each prompt must include the
project metadata, the detected language, and the in-scope file list.

> [!IMPORTANT]
> Every subagent reports findings only — **none of them edit code.**

### Subagent 1: Aspirational structure

Soul of the skill: push for restructurings that *delete* whole categories of
complexity, not rearrange them. Include the code-judo brief from
[`../shared/CODE-JUDO.md`](../shared/CODE-JUDO.md) verbatim in the prompt, then
the triggers and remedies below.

#### Concrete triggers to scan for

Flag only these specific, measurable signals — no fuzzy "looks off" findings:

- **File >1000 lines** — propose a decomposition.
- **Function >50 lines doing multiple things** — propose extraction.
- **Wrapper / identity functions** — forward arguments to another call without
  adding validation, defaulting, or transformation.
- **Loose type boundaries** — values typed as the language's escape hatch
  (`any`/`interface{}` in Go, `any`/`unknown` in TypeScript, `Object` in
  Java/C#, dynamic dispatch in Python) immediately narrowed via type assertion
  or runtime check — a missing typed boundary.
- **Feature flags scattered across >1 file** — feature conditionals bolted into
  shared paths instead of behind a dedicated abstraction.
- **Near-duplicate helpers** where a canonical utility already exists.
- **Switch/if chains with >5 arms over the same discriminant** — missing
  dispatch table, polymorphic type, or state machine.
- **Sequential `await` / `go func()` chains over independent work units** —
  unnecessary serialization that parallelism would also simplify.
- **Thin abstractions / pass-through helpers** that add indirection without
  buying clarity.
- **Logic in the wrong layer** — feature logic in shared utilities, or storage
  details bleeding into handlers.
- **Non-atomic sequences** — related state updates that can leave the system
  half-applied when a more atomic structure is obvious.

#### Preferred remedies

Bias toward:

- Delete a layer of indirection rather than polishing it.
- Reframe the state model so conditionals disappear instead of centralizing.
- Change the ownership boundary so the feature becomes a natural extension of an
  existing abstraction.
- Turn special-case logic into a simpler default flow with fewer exceptions.
- Replace condition chains with a typed model or explicit dispatcher.
- Collapse duplicate branches into a single clearer flow.
- Reuse the canonical helper instead of a near-duplicate.
- Move logic to the package/module/layer that owns the concept.
- Parallelize independent work when that also simplifies orchestration.
- Restructure related updates into a more atomic flow.

Do not settle for "maybe rename this" when the issue is structural, nor for a
cleaner version of the same messy idea when a much simpler idea is plausible.

#### Report shape

Group by severity. Each finding: file + approximate line range, the specific
trigger that fired, why it matters (impact, not aesthetics), concrete remedy
(delete X, reframe Y, extract Z).

### Subagent 2: Standards drift

Maps where the code has drifted from its own documented conventions.

#### Standards sources

Collect these paths before spawning, pass the list to the subagent:

- `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md` at root and in subdirectories
- `STYLE.md`, `STANDARDS.md`, `STYLEGUIDE.md` at root or under `docs/`
- `docs/adr/**/*.md` — ADRs are standards
- Per-package `README.md` files that document conventions
- `.editorconfig`, `.eslintrc.*`, `biome.json`, `prettier.config.*`,
  `tsconfig.json` — machine-enforced; the subagent skips what tooling covers

**For Go projects** (`go.mod` present), also include the user's canonical Go
conventions — authoritative for Go audits (naming, error wrapping, layer
separation `handlers -> service -> repository`, observability, constructors,
stdlib preferences like `net/netip` over `net`, `http.MethodGet` over `"GET"`).
Do not include them for non-Go audits:

- `~/.claude/rules/go.md`
- `~/.agents/skills/go-conventions/SKILL.md`

#### Subagent brief

> Read all standards sources first. Then scan the codebase. Report places where
> the code violates a documented standard. For each finding cite the standard
> (file path + the rule). Distinguish hard violations (clear rule + clear
> breach) from judgement calls. Skip anything machine-enforced tooling already
> covers — focus on what humans must catch.

### Subagent 3: Purpose drift

Maps where the code has drifted from its stated purpose.

#### Purpose sources

- Top-level `README.md`
- Per-package / per-module `README.md` files
- `docs/**/*.md` — especially anything matching PRD/spec/design
- `package.json` description, `go.mod` module path, `Cargo.toml` description,
  etc.

If the scope has no purpose docs at all, this subagent reports "no purpose docs
found" and is skipped in the synthesis.

#### Subagent brief

> Read the stated-purpose docs first. Then read the code. Report:
>
> 1. **Vestigial features** — documented as core but the code looks abandoned,
>    has no recent commits, or no callers.
> 1. **Scope creep** — significant code with no stated purpose in any doc.
>    Unsanctioned features, dead-end experiments, or undocumented expansion.
> 1. **Doc/code divergence** — what the docs say vs. what the code does.
>
> Quote the doc line for each finding.

### Subagent 4: Test coverage audit

A redesign without a behavioral safety net is rewriting from memory. Map what is
*currently protected by tests* so the synthesis can flag undertested targets.

#### Sources

- All test files (`*_test.go`, `*.test.ts`, `tests/**`, `__tests__/**` —
  language-aware)
- Coverage reports if present (`coverage.out`, `lcov.info`, `coverage.xml`)
- CI config (`.github/workflows/**`, `.gitlab-ci.yml`, `Makefile`) to identify
  which test suites actually run

#### Subagent brief

> Map the codebase's behavioral coverage. Do not judge test *quality* unless
> egregious (e.g. tests that assert nothing). The goal is a coverage map, not a
> test review.
>
> For each major boundary (public API, package boundary, integration point),
> report:
>
> - Behaviors covered by tests — cite test names + files
> - Public APIs with NO tests
> - Untested error paths
> - Untested concurrency / lifecycle behaviors
> - Integration points with no end-to-end coverage
>
> Tag each finding with the boundary it concerns so the synthesis can
> cross-reference it against redesign targets.

## Synthesis

After all four return, synthesize a coherent redesign strategy:

- **Cross-axis priority** — findings on multiple axes go to the top. An
  aspirational restructure that also resolves a standards violation and a
  purpose drift is highest priority.
- **Delete over rearrange** — prefer findings that *delete* complexity.
- **Root cause, not symptom** — name the underlying design issue.
- **Coverage cross-reference** — for every restructure target, check Subagent
  4's coverage map. If the boundary lacks tests, tag the task
  `BLOCKED-ON-TESTS` and list the specific pinning tests it needs.

This is a soft gate: the plan is still produced. The user may proceed in
coverage-light areas, but the risk is explicit.

### Tension with "no code without a failing test"

If the user's `CLAUDE.md` (or equivalent) says *no code without a failing
test*, the Phase 0 characterization tests are the **documented exception**: they
pass by construction, pinning existing behavior so the redesign cannot silently
change it. The output plan must note this exception explicitly so a downstream
agent doesn't mechanically reject Phase 0.

## Output

Emit the plan using the shared skeleton in
[`../shared/REIMPL-PLAN-TEMPLATE.md`](../shared/REIMPL-PLAN-TEMPLATE.md).
Substitute:

- `{Plan Type}` → `Redesign`
- `{Scope Name}` → the scope name (subsystem or `codebase`)
- `{plan-type}` → `redesign`
- `{slug}` → the scope slug

`redesign` is more demanding than `refactor`, so it fills the template's
insertion-point anchors and overrides one phase:

**`extra metadata bullets`** — add:

```markdown
- **Scope**: codebase | <subsystem path>
```

**`findings / analysis sections`** (between Current State and What We Should
Have Done First) — add:

```markdown
## Findings

### Aspirational Structure

{Subagent 1's findings, grouped by severity. Each entry: file:line, the
trigger that fired, impact, concrete remedy.}

### Standards Drift

{Subagent 2's findings. Each entry cites the standard (file + rule).}

### Purpose Drift

{Subagent 3's findings. Each entry quotes the doc line.}

### Test Coverage

{Subagent 4's coverage map, focused on boundaries the redesign touches.}

## Cross-Cutting Wins

{Findings that resolve multiple axes — these go first.}

## Behavioral Invariants

{Explicit list of behaviors the redesign must preserve, derived from
purpose docs and existing tests. This is the post-redesign verification
target.}
```

**`pre-prerequisite phases`** (before Phase 1, inside Reimplementation Tasks) —
add the Phase 0 callout and phase:

````markdown
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

Phase 2 tasks should cite their pinning: `Pinned by: Phase 0 tasks {0.x, 0.y}.`
— or, if the boundary still lacks coverage, `BLOCKED-ON-TESTS: needs {specific missing tests}.`

**Phase N: Verification** — override the template's generic verification tasks
with:

```markdown
### Phase N: Verification

- [ ] **Task N.1**: Run all Phase 0 pinning tests — must still pass.
- [ ] **Task N.2**: Confirm every behavioral invariant from the section
  above still holds.
- [ ] **Task N.3**: Verify complexity reduction — file/function size
  metrics, layer-leak count, branching count.
```

**`trailing sections`** (after File Changes) — add:

```markdown
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
```

In `Notes & Caveats`, also list any tasks tagged `BLOCKED-ON-TESTS`.

## Surface durable rules

Load [`durable-rules/SKILL.md`](../durable-rules/SKILL.md) and follow its
process.

## Additional guidelines

The shared template carries the base plan-writing guidelines. For redesign,
also: be direct and demanding about quality. Do not soften major
maintainability issues into mild suggestions. If the implementation missed a
dramatic simplification, say so clearly.

## Non-goals

- Does not edit code. (See `cleanup`.)
- Does not review diffs. (See `code-review`.)
- Does not investigate a single feature. (See `refactor`.)
- Does not approve or block PRs — output is a plan, not a verdict.

## References

- Peer skills: `refactor` (single-feature investigation), `cleanup` (AI-slop
  fixes), `code-review` (multi-axis diff review).
