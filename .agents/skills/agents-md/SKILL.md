---
name: agents-md
description: >-
  Make AGENTS.md the canonical project-instructions file, with CLAUDE.md and
  GEMINI.md as stubs that import it, and audit it for drift and lessons. Use
  when onboarding a project, auditing AGENTS.md, or updating agent
  instructions.
argument-hint: "[--learn]"
metadata:
  model-tier: moderate
---

# Agents-MD

Reconcile project-instructions files so AGENTS.md holds the content and
`CLAUDE.md` and `GEMINI.md` are thin stubs that `@`-import it, so Claude Code,
Gemini CLI, GitHub Copilot, and any agent that reads `AGENTS.md` share one
copy. Write nothing until the user confirms, keep the user's wording when
merging, and never drop content they haven't agreed to lose: when in doubt,
keep both versions in AGENTS.md and flag the overlap. Wrap Markdown at 80
columns.

**Why stubs work.** Claude Code reads `CLAUDE.md`, which supports `@path`
imports and
[recommends `@AGENTS.md`](https://code.claude.com/docs/en/memory#agents-md).
Gemini CLI reads `GEMINI.md`, which
[supports `@file.md` imports](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md).
GitHub Copilot
[reads `AGENTS.md` natively](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot),
nearest in the tree winning, so it needs no stub; its legacy
`.github/copilot-instructions.md` has no import syntax, so treat it as content
to drain, never as a stub.

**Mode.** Inventory `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and
`.github/copilot-instructions.md` at the project root. A file whose only
content is `@AGENTS.md` (or boilerplate) is a stub, not content.

- **Reconcile** (the default, one-shot): AGENTS.md is missing, weaker than
  another file, or not imported by both stubs. Follow the decision table.
- **Update** (re-runnable): AGENTS.md has content and both stubs import it.
  Run the update steps.
- **`--learn`:** run only the session-lessons step of Update against the
  existing AGENTS.md, still behind one confirmation. If there's no AGENTS.md,
  say so and pick the mode as normal.

## The rubric

Before reconciling or a full update, read
[PROJECT-STEWARDSHIP.md](../shared/PROJECT-STEWARDSHIP.md), and use it to
capture the project's direction under WHY and to audit conflicting
instructions. The rubric is both the template for a new AGENTS.md and the
score for choosing between existing files. A good AGENTS.md covers three
things, in under ~200 lines, because every tool loads it in full at session
start and longer files lower adherence:

1. **WHY:** what the project is and the problem it solves.
2. **WHAT:** repo structure, language boundaries, and key entry points.
3. **HOW:** build, test, and lint commands, plus gotchas the code doesn't
   reveal.

Point to docs rather than repeating them, and leave out what tools and the
code already show: architecture, API surfaces, coding style.

**Domain language.** Use a root `GLOSSARY.md` as the glossary. If it's
missing but a root `CONTEXT.md` exists, point to that instead of creating a
duplicate, and warn with `⚠️` that it should be renamed `GLOSSARY.md`. When
either exists, open AGENTS.md with a pointer to it, never a copy, naming the
words the glossary flags as overloaded (drop the "such as" clause if it names
none):

````md
## Domain Language

Canonical domain terms and their relationships live in `GLOSSARY.md`.
Consult it before introducing new terminology or reusing overloaded
words such as "active", "domain", or "activation". If the project still
uses legacy `CONTEXT.md`, point to that existing file until it is renamed.
````

## Reconcile

| AGENTS.md | CLAUDE.md | GEMINI.md | Action                                                                          |
| --------- | --------- | --------- | ------------------------------------------------------------------------------- |
| none      | none      | none      | Write AGENTS.md from the rubric, then stub both                                 |
| content   | none      | none      | Stub both                                                                       |
| content   | stub      | stub      | Already canonical: run Update                                                   |
| content   | content   | any       | Score and merge                                                                 |
| content   | any       | content   | Score and merge                                                                 |
| none      | content   | none      | Score CLAUDE.md, promote or rewrite it to AGENTS.md, then stub both             |
| none      | none      | content   | Score GEMINI.md, promote or rewrite it to AGENTS.md, then stub both             |
| none      | content   | content   | Score both, use the higher as the base, backfill from the other, then stub both |

A substantive `.github/copilot-instructions.md` joins any scoring as one more
candidate.

**Score and merge.** Score each candidate on rubric coverage (a point each
for WHY, WHAT, and HOW that's present, accurate, and current), on pointing
to docs within ~200 lines, and on staying tool-agnostic. The highest scorer
becomes the base; backfill the missing rubric sections from the rest. Move
tool-specific content (Claude skills or plan mode, Gemini checkpointing or
sandbox) into the matching stub, and Copilot-specific content into
`.github/copilot-instructions.md`. If two candidates score about the same,
show the user a short diff summary and ask which is canonical.

**Stubs.** The import line is the only required content; tool-specific notes
go after it under their own heading, `## Claude Code` or `## Gemini CLI`:

````md
@AGENTS.md

## Claude Code

<Claude-specific notes here>
````

**Copilot.** Once merged, reduce `.github/copilot-instructions.md` to
genuinely Copilot-specific guidance or delete it, never leaving an import
line in it. Leave it alone if it's absent or already thin. If an org
requires the file, make it a prose pointer:

````md
The canonical project instructions live in `AGENTS.md`; read that file.

<Copilot-specific notes here>
````

## Update

Run these in order, then gate every proposed change behind one confirmation.

1. **Audit the structure** against the rubric. Flag missing or malformed
   WHY, WHAT, or HOW; a missing Domain Language pointer when a glossary
   exists; length past ~200 lines; tool-specific content that belongs in a
   stub; and content that has built up in `.github/copilot-instructions.md`.
   Done when each flag has a concrete fix.
2. **Check freshness** read-only: confirm the build, test, and lint commands
   exist (in the `Makefile`, `package.json` scripts, or equivalent), that
   entry points and structure still match, and that listed gotchas still
   apply, citing what you checked. On a large repo, hand this to a
   review-only subagent (or one per kind of claim) that returns findings,
   following [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md).
   Done when every WHAT and HOW claim is confirmed or flagged.
3. **Harvest session lessons:** durable, non-obvious facts from this session
   that fit WHY, WHAT, or HOW, such as a gotcha that cost time or a command
   nobody would guess. Leave out anything the code shows, and skip the step
   if nothing qualifies. Done when each lesson is proposed or the step is
   skipped.
4. **Confirm and write.** Show the combined diff or a short summary and
   write only after the user confirms. Done when the user has approved and
   the changes are written.

## Verify

After writing any change, confirm:

1. AGENTS.md meets the rubric and is tool-agnostic.
2. AGENTS.md opens with a Domain Language pointer if a `GLOSSARY.md` or
   legacy `CONTEXT.md` exists.
3. `CLAUDE.md` and `GEMINI.md` each have `@AGENTS.md` on their first
   non-empty line.
4. `.github/copilot-instructions.md`, if present, has no import line and no
   content missing from AGENTS.md.
5. Only genuinely tool-specific content lives outside AGENTS.md.

Done when all five hold and you've told the user which file is canonical,
what moved, and what was created.
