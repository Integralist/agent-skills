# Redesign Audit Lenses

For a feature, cover lenses 1, 2, and 4; for a subsystem or codebase, cover
all four. Give each reviewer the metadata snapshot, primary language, scoped
file list, and its brief. Read-only: no code edits or state-changing commands.

## 1. Structure (judgment-tier model)

The heart of the audit: find restructurings that delete whole categories of
incidental complexity rather than rearranging them. Include the brief from
[CODE-JUDO.md](../../shared/CODE-JUDO.md) verbatim and point to
[code-module-design](../../code-module-design/SKILL.md) (apply its deletion
test to shallow abstractions).

Map the current implementation first (key files, types, ownership, end-to-end
data/control flow). Then diagnose the highest-leverage structural problems—
including wrong data/state models, misplaced ownership boundaries, shallow
pass-through wrappers, fragmented concerns, scattered feature conditionals,
loose escape-hatch types narrowed at runtime, duplicate helpers, non-atomic
related state updates, unnecessary sequential I/O, or oversized/deeply-nested
functions and dispatch chains. Treat size/nesting counts as signals, not a
filter: never miss a deeper architectural simplification because it doesn't
trip a line-count rule. A rename or cosmetic tidy-up is not a remedy.

Report:
1. Implementation map.
2. Findings ranked by impact (`file:line`, problem/impact, concrete remedy:
   delete X, reframe Y, merge/extract Z).
3. Missing prerequisites (interfaces, shared types, test fakes, decisions).
4. **Key insight:** the single change that makes the most complexity vanish.

## 2. Standards and precedent drift

Pass [precedent](../../precedent/SKILL.md) and the repo's standards sources
(`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/adr/**/*.md`, style docs,
package READMEs, plus linter/formatter configs so it skips what tooling
already enforces). For Go, include [conventions-go](../../conventions-go/SKILL.md)
(and [SERVICE-ARCHITECTURE.md](../../conventions-go/references/SERVICE-ARCHITECTURE.md)
for HTTP services).

Report clear rule violations (citing file and rule, separating hard breaches
from judgement calls) and unwritten precedent drift per steps 1–2 of
`precedent` (citing >= 2 peers, skipping cosmetic one-offs, ranked by blast
radius).

## 3. Purpose drift (subsystem or codebase only)

Read top-level/module READMEs, `docs/**/*.md` (PRDs, specs, designs), and
package metadata (`go.mod`, `package.json`, `Cargo.toml`). If no purpose docs
exist, report `"no purpose docs found"` so synthesis skips it.

Quote the doc line for each finding: vestigial/abandoned documented features,
undocumented scope creep, and doc-vs-code divergence.

## 4. Test coverage

Inspect test files, coverage reports, and CI/Makefile test targets. Map
behavioural coverage per major boundary (public API, package boundary,
integration point): covered behaviours (with test files/names), untested
public APIs, missing error/concurrency/lifecycle coverage, and unverified
integration boundaries. Flag test quality only when egregious (e.g. tests
asserting nothing).
