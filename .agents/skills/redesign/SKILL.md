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

Strategic, codebase-wide redesign audit. Goes wider than `refactor` (which
investigates a single feature), is not a diff review (`code-review`), and is
not AI-slop cleanup (`cleanup`). Reviews the *current state* of the code and
asks: **knowing what we know now, if we started over, how would we do this
differently — and what could we delete entirely?**

## Input

The argument follows the skill invocation. Detect the scope:

| Argument             | Scope                                  |
| -------------------- | -------------------------------------- |
| No argument          | **Whole codebase**                     |
| Subsystem name/path  | **Scoped audit** (e.g. `api`, `auth`)  |

Parse the argument into a kebab-case slug for the output filename. No
argument → slug `codebase`.

## Gather project metadata

Run the following git commands in the current working directory and capture
output for inclusion in every subagent prompt. The metadata lets each
subagent prioritize empirically rather than guessing.

### Churn hotspots — most-changed files in the last year

```bash
git log --format=format: --name-only --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
```

### Bus factor — contributors ranked by commit count

```bash
git shortlog -sn --no-merges
git shortlog -sn --no-merges --since="6 months ago"
```

### Bug clusters — files most often touched in bug-fix commits

```bash
git log -i -E --grep="fix|bug|broken" \
  --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

### Commit velocity — commits per month

```bash
git log --format='%ad' --date=format:'%Y-%m' \
  | sort | uniq -c
```

### Crisis patterns — reverts, hotfixes, rollbacks

```bash
git log --oneline --since="1 year ago" \
  | grep -iE 'revert|hotfix|emergency|rollback'
```

### Cross-reference

Files that appear in **both** churn hotspots and bug clusters are the
highest-risk code. Flag these explicitly in the metadata passed to subagents.

## Detect language

Detect the project's primary language before spawning subagents:

- Go — `go.mod` at repo root
- TypeScript/JavaScript — `package.json` with `typescript` or `.ts` files
- Other — fall back to file-extension heuristics

The detection result is passed to subagents so they can apply the right
checks (and so the Standards subagent knows whether to read user-level Go
conventions).

## Spawn four parallel subagents

Spawn all four in a single message with parallel tool calls. All four are
the platform's `general-purpose` (or workhorse) subagent role. Each prompt
must include the project metadata, the detected language, and the in-scope
file list.

Every subagent must report findings only — **none of them edit code**.

### Subagent 1: Aspirational structure

Soul of the skill: push hard for restructurings that *delete* whole
categories of complexity rather than rearranging it. Include this brief
verbatim in the subagent prompt:

> You are a principal engineer performing a strict, ambitious code-quality
> audit. Do not stop at "this could be a bit cleaner." Look for reframings
> that make whole branches, helpers, modes, conditionals, or layers
> disappear entirely. Prefer the solution that makes the code feel
> inevitable in hindsight. If you see a path to *delete* complexity rather
> than rearrange it, push hard for that path.
>
> Assume there is often a "code judo" move available — a re-organization
> that uses the existing architecture more effectively and makes a whole
> class of complexity vanish. Find it.

#### Concrete triggers to scan for

The subagent must scan for these specific, measurable signals. Do not flag
fuzzy "looks off" findings — every finding must point at one of these:

- **File >1000 lines** — flag and propose a decomposition.
- **Function >50 lines doing multiple things** — propose extraction.
- **Wrapper / identity functions** — functions that only forward arguments
  to another call without adding validation, defaulting, or transformation.
- **Loose type boundaries** — values typed as the language's escape hatch
  (`any`/`interface{}` in Go, `any`/`unknown` in TypeScript, `Object` in
  Java/C#, dynamic dispatch in Python) immediately narrowed via type
  assertion or runtime check. Evidence of a missing typed boundary the
  redesign should make explicit.
- **Feature flags scattered across >1 file** — feature-specific conditionals
  bolted into shared paths instead of behind a dedicated abstraction.
- **Near-duplicate helpers** where the codebase already has a canonical
  utility for the same job.
- **Switch/if chains with >5 arms over the same discriminant** — missing
  dispatch table, polymorphic type, or state machine.
- **Sequential `await` / `go func()` chains over independent work units** —
  unnecessary serialization where parallel execution would also simplify.
- **Thin abstractions / pass-through helpers** that add indirection without
  buying clarity.
- **Logic in the wrong layer** — feature logic in shared utilities, or
  storage details bleeding into handlers.
- **Non-atomic sequences** — related state updates that can leave the
  system half-applied when a more atomic structure is obvious.

#### Preferred remedies

Bias toward suggestions like:

- Delete a whole layer of indirection rather than polishing it.
- Reframe the state model so conditionals disappear instead of getting
  centralized.
- Change the ownership boundary so the feature becomes a natural extension
  of an existing abstraction.
- Turn special-case logic into a simpler default flow with fewer exceptions.
- Replace condition chains with a typed model or explicit dispatcher.
- Collapse duplicate branches into a single clearer flow.
- Reuse the existing canonical helper instead of introducing a near-duplicate.
- Move logic to the package/module/layer that already owns the concept.
- Parallelize independent work when that also simplifies orchestration.
- Restructure related updates into a more atomic flow.

Do not be satisfied with "maybe rename this" feedback when the real issue
is structural. Do not be satisfied with a merely cleaner version of the
same messy idea if there is a plausible path to a much simpler idea.

#### Report shape

Group findings by severity. Each finding must include:

- File and approximate line range
- The specific trigger from the list above that fired
- Why it matters (impact, not aesthetics)
- Concrete remedy (delete X, reframe Y, extract Z)

### Subagent 2: Standards drift

Maps where the code has drifted from its own documented conventions.

#### Standards sources

Collect these paths before spawning, pass the list to the subagent:

- `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md` at repo root and in
  subdirectories
- `STYLE.md`, `STANDARDS.md`, `STYLEGUIDE.md` at root or under `docs/`
- `docs/adr/**/*.md` — ADRs are standards
- Per-package `README.md` files that document conventions
- `.editorconfig`, `.eslintrc.*`, `biome.json`, `prettier.config.*`,
  `tsconfig.json` — note as machine-enforced; the subagent skips what
  tooling already covers

**For Go projects** (when `go.mod` is present), also include the user's
personal Go conventions:

- `~/.claude/rules/go.md`
- `~/.agents/skills/go-conventions/SKILL.md`

These two files are the user's canonical Go style — naming, error wrapping,
layer separation (`handlers -> service -> repository`), observability
patterns, constructor patterns, stdlib preferences (`net/netip` over `net`,
`http.MethodGet` over `"GET"`, etc.). Treat them as authoritative for Go
audits. Do not include them for non-Go audits.

#### Subagent brief

> Read all standards sources first. Then scan the codebase. Report places
> where the code violates a documented standard. For each finding cite the
> standard (file path + the rule). Distinguish hard violations (clear rule
> + clear breach) from judgement calls. Skip anything machine-enforced
> tooling already covers — focus on what humans must catch.

### Subagent 3: Purpose drift

Maps where the code has drifted from its stated purpose.

#### Purpose sources

- Top-level `README.md`
- Per-package / per-module `README.md` files
- `docs/**/*.md` — especially anything matching PRD/spec/design
- `package.json` description, `go.mod` module path, `Cargo.toml`
  description, etc.

If the scope has no purpose docs at all, this subagent reports "no purpose
docs found" and is skipped in the synthesis.

#### Subagent brief

> Read the stated-purpose docs first. Then read the code. Report:
>
> 1. **Vestigial features** — features documented as core but the code
>    looks abandoned, has no recent commits, or no callers.
> 2. **Scope creep** — significant code with no stated purpose in any doc.
>    May be unsanctioned features, dead-end experiments, or scope expansion
>    nobody wrote down.
> 3. **Doc/code divergence** — what the docs say the system does vs. what
>    the code actually does.
>
> Quote the doc line for each finding.

### Subagent 4: Test coverage audit

A redesign without a behavioral safety net is rewriting from memory. This
subagent maps what is *currently protected by tests* so the synthesis can
flag undertested redesign targets.

#### Sources

- All test files (`*_test.go`, `*.test.ts`, `tests/**`, `__tests__/**` —
  language-aware)
- Coverage reports if present (`coverage.out`, `lcov.info`,
  `coverage.xml`)
- CI config (`.github/workflows/**`, `.gitlab-ci.yml`, `Makefile`) to
  identify which test suites actually run

#### Subagent brief

> Map the codebase's behavioral coverage. Do not judge test *quality*
> unless egregious (e.g. tests that assert nothing). The goal is a
> coverage map, not a test review.
>
> For each major boundary (public API, package boundary, integration
> point), report:
>
> - Behaviors covered by tests — cite test names + files
> - Public APIs with NO tests
> - Untested error paths
> - Untested concurrency / lifecycle behaviors
> - Integration points with no end-to-end coverage
>
> Tag each finding with the boundary it concerns so the synthesis phase
> can cross-reference it against redesign targets.

## Synthesis

After all four subagents return, synthesize a coherent redesign strategy:

- **Cross-axis priority** — findings that show up on multiple axes go to
  the top. An aspirational restructure that also resolves a standards
  violation and a purpose drift is the highest-priority item.
- **Delete over rearrange** — prefer findings that *delete* complexity
  over those that *move it around*.
- **Root cause, not symptom** — name the underlying design issue, not the
  surface-level lint.
- **Coverage cross-reference** — for every restructure target, check
  Subagent 4's coverage map. If the boundary lacks tests, tag the task
  `BLOCKED-ON-TESTS` and list the specific pinning tests it needs.

This is a soft gate: the plan is still produced. The user can choose to
proceed in coverage-light areas, but the risk is explicit.

### Tension with "no code without a failing test"

If the user's `CLAUDE.md` (or equivalent) says *no code without a failing
test*, characterization tests added in Phase 0 of the output plan are the
**documented exception**: they pass by construction, pinning existing
behavior so the redesign cannot silently change it. The output plan must
note this exception explicitly so a downstream agent doesn't mechanically
reject Phase 0.

## Output

Create the output directory with `mkdir -p docs/plans`, then write the
plan to `docs/plans/<yyyy-mm-dd>-redesign-<slug>.md` (date
prefix from today's date):

````markdown
# Redesign: {Scope Name}

- **Status**: Planning
- **Author**: {git config user.name}
- **Created**: {YYYY-MM-DD}
- **Language**: {detected language}
- **Scope**: codebase | <subsystem path>

## Summary

{One paragraph: the systemic problem and the high-level redesign strategy.}

## Current State

{Files, data flow, where the problems are. Mermaid diagram if the system
is complex.}

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

## What We Should Have Done First

{Prerequisites — interfaces, shared types, test infrastructure,
architectural decisions — that should have existed before the current
implementation was built.}

## Reimplementation Tasks

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

### Phase 1: Prerequisites

- [ ] **Task 1.1**: {Interfaces, shared types, fakes the redesign needs.}

### Phase 2: {Core Redesign}

- [ ] **Task 2.1**: {Specific restructure.}
  Pinned by: Phase 0 tasks {0.x, 0.y}.
  {Or, if the boundary still lacks coverage:}
  `BLOCKED-ON-TESTS`: needs {specific missing tests}.

### Phase N-1: Documentation

- [ ] **Task (N-1).1**: Update `**/README.md` files for packages whose
  public API changed.
- [ ] **Task (N-1).2**: Update `docs/**/*.md` for user-facing behavior
  changes.

### Phase N: Verification

- [ ] **Task N.1**: Run all Phase 0 pinning tests — must still pass.
- [ ] **Task N.2**: Confirm every behavioral invariant from the section
  above still holds.
- [ ] **Task N.3**: Verify complexity reduction — file/function size
  metrics, layer-leak count, branching count.

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

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

## Notes & Caveats

- {Edge cases, risks, open questions, tasks tagged `BLOCKED-ON-TESTS`.}
````

Print a short summary and the file path in the conversation.

## Surface durable rules

After producing the plan, review the investigation findings for **systemic
patterns** that should be codified as ongoing conventions or anti-patterns
— guidance that applies beyond this specific redesign.

1. If the investigation surfaced no durable lessons, skip this step
   entirely. Do not force it.
2. For each candidate rule, check the project's rules or conventions
   directory for an existing file that covers the topic. Update it if one
   exists.
3. If no existing file covers the topic, propose a new conventions file.
4. **Present the proposed rule(s) to the user for confirmation before
   writing.**
5. Only write after the user confirms.

## Guidelines

- Use specific file paths and line numbers when referencing code.
- Code snippets must use real function signatures, real types, real import
  paths. Not pseudocode.
- Each task should be small enough to complete in one session.
- The plan describes a redesign, not incremental patches. The goal is
  "what would we do if starting over," not "what's the minimal diff."
- Be direct and demanding about quality. Do not soften major
  maintainability issues into mild suggestions. If the implementation
  missed an opportunity for a dramatic simplification, say so clearly.
- Wrap all Markdown output at 80 columns.

## Non-goals

- This skill does not edit code. (See `cleanup`.)
- This skill does not review diffs. (See `code-review`.)
- This skill does not investigate a single feature. (See `refactor`.)
- This skill does not approve or block PRs — output is a plan, not a
  verdict.

## References

- Existing peer skills: `refactor` (single-feature investigation),
  `cleanup` (AI-slop fixes), `code-review` (multi-axis diff review).
