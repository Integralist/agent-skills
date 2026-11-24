---
name: to-spec
description: >-
  Write a project spec: the problem, the solution, and Gherkin acceptance
  criteria, with any delta against the living spec. Use when specifying a
  feature, saving a spec discussed in chat, or when another skill needs a spec.
argument-hint: "[--source=<path|#issue|url>] [--github] [steering]"
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Grep, Read, Write
metadata:
  model-tier: complex
---

Write `spec.md` from a file or discussion: what to build, for whom, and the
Gherkin criteria defining done. Capture interfaces, contracts, schemas, and
API shape—not implementation paths or code. Do not plan, build, or edit
`docs/specs/` (later living-spec changes use
[spec-delta](../spec-delta/SKILL.md)).

**Stop and ask.** Follow the source as given. If something is missing,
contradictory, or points to a wrong design, tell the user and wait. Do not fill
gaps with guesses.

## Workflow

1. **Choose source and workspace.** Use `--source=<path|#issue|url>` if given,
   or this session if omitted. For `--github` or an issue reference (`#<n>` or
   URL), read and follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) instead
   of `projects/`. Before preserving request evidence or history, read
   [PROJECT-INTENT.md](../shared/PROJECT-INTENT.md). Use `intent.md` when
   needed; keep Development Brief to the current summary and a source link.
2. **Read current truth.** Inspect linked research, `docs/adr/`, touched code,
   and owning `docs/specs/<capability>.feature` files so new criteria extend
   or modify existing scenarios rather than duplicating them. Living specs are
   the baseline (or code when none exist); preserve governing decisions.
3. **Draft for the reader.** Before any prose or Gherkin, read and follow
   [voice-product](../voice-product/SKILL.md),
   [SPEC-FORMAT.md](../shared/SPEC-FORMAT.md) and the
   [writing guide and clarity check](references/SPEC-GUIDE.md). Apply the
   guide's newcomer-clarity rules, Rule-first invariant pass, and template.
4. **Write and check.** Write any needed `intent.md` in the selected mode.
   Fill metadata (`Status: Draft`, `Author` from `git config user.name`,
   `Created` from `date +%F`, primary `Language`), following
   [Markdown conventions](../conventions-markdown/SKILL.md) (short unique SHAs
   in baseline metadata, full SHAs in pinned source links). Run the guide's
   whole-draft clarity check before handoff, and run the repo's spec check
   (e.g. `make check-specs` or acceptance dry-run) when available. For a
   non-trivial new spec or behaviour change (when no parent workflow runs its
   own critique), have a separate read-only reviewer read and follow
   [critique](../critique/SKILL.md) on `spec.md`. For a scoped revision,
   review changed sections and related terms/references without expanding the
   edit or restarting architecture critique.

   - **On disk:** Write in the source project folder or
     `projects/<yyyy-mm-dd>-<slug>/spec.md`. Read
     [PROJECTS-README.md](../shared/PROJECTS-README.md) before indexing it.
   - **GitHub:** Follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md)
     to publish `spec.md` as a Root Issue Artifact and update its index.

**Done when** the spec is written, clarity and contract checks are complete,
and the user has its path plus any open questions or verification gaps
(document checks do not prove passing acceptance tests).
