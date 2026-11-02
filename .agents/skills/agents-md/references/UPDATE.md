# Update and verify instruction files

## Full Update

Audit structure, then freshness read-only, then lessons. Collect all proposed
changes; request one confirmation before writing.

1. **Audit structure.** Check [RECONCILE.md](RECONCILE.md#rubric-and-domain-language).
   Flag missing/malformed WHY, WHAT, or HOW; a missing Domain Language pointer
   when a glossary exists; length over about 200 lines; tool-specific content
   for stubs; and accumulated `.github/copilot-instructions.md` content. Give
   each flag a concrete fix.
2. **Check freshness.** Read-only: confirm build, test, and lint commands in the
   Makefile, `package.json` scripts, or equivalent; listed entry points and
   repository structure; and each listed gotcha. Cite evidence. For a large
   repo, delegate to review-only subagents (or one per claim type), following
   [SUBAGENT-STEERABILITY.md](../../shared/SUBAGENT-STEERABILITY.md). Confirm or
   flag every WHAT and HOW claim.
3. **Harvest session lessons.** Propose durable, non-obvious facts from this
   session fitting WHY, WHAT, or HOW, such as a costly gotcha or unexpected
   command. Exclude facts shown by code. Propose each, or explicitly say this
   step is skipped if none qualify.
4. **Confirm and write.** Show the combined diff or a short summary. Write only
   after the user confirms.

## `--learn`

Run only step 3 against the existing `AGENTS.md`, then use the same confirmation
gate. If `AGENTS.md` is missing, tell the user and choose a mode normally.

## Verify after any write

Confirm all five conditions:

1. `AGENTS.md` meets the rubric and is tool-agnostic.
2. It opens with a Domain Language pointer when `GLOSSARY.md` or legacy
   `CONTEXT.md` exists.
3. `CLAUDE.md` and `GEMINI.md` each have `@AGENTS.md` on their first
   non-empty line.
4. `.github/copilot-instructions.md`, if present, has no import line and no
   content missing from `AGENTS.md`.
5. Only genuinely tool-specific content lives outside `AGENTS.md`.

Finish by reporting which file is canonical, what moved, and what was created.
