---
name: agents-md
description: >-
  Make AGENTS.md the canonical project-instructions file and
  ensure CLAUDE.md and GEMINI.md are thin pointers that
  @-import it. Promotes existing CLAUDE.md/GEMINI.md content
  into AGENTS.md when AGENTS.md is missing or weaker,
  creates stub CLAUDE.md and GEMINI.md when absent, and
  bootstraps a fresh AGENTS.md when the project has no
  instructions file at all. Once canonical, also audits an
  existing AGENTS.md for structure drift, verifies its
  build/test/lint commands and gotchas are still accurate,
  and harvests durable lessons from the current session.
  Use when the user wants to tidy up agent instructions,
  onboard a project, check whether AGENTS.md is up to date,
  audit its structure, add what was learned this session,
  or says /agents-md.
---

# Agents-MD

Reconcile project-instructions files so **AGENTS.md is canonical** and
`CLAUDE.md` / `GEMINI.md` are thin stubs that `@`-import it. The same
project then works from Claude Code, Gemini CLI, GitHub Copilot, or any
agent that honours `AGENTS.md`, with no duplicated content.

## Two modes

Determine the mode first, using the same inventory the Decision table
needs (see "Inputs").

- **Reconcile/Bootstrap** (default) — AGENTS.md is missing, weaker than
  an existing CLAUDE.md/GEMINI.md, or the stubs don't import it. Run the
  Decision table. One-shot.
- **Update/Audit** — AGENTS.md exists, is canonical, and both stubs
  already import it (the `content | stub | stub` state). Run "Update
  mode". Re-runnable.

## Flags

- `--learn` — skip straight to the session-lessons harvest. Bypass mode
  determination, the Decision table, and the structure/freshness jobs;
  run only job 3 of Update mode against the existing AGENTS.md. Use at a
  session's end when you only want to record durable lessons, not a full
  audit. If AGENTS.md does not exist, report that and fall back to
  normal mode determination.

## Why this works

- Claude Code reads `CLAUDE.md`, not `AGENTS.md`, but `CLAUDE.md`
  supports `@path` imports, and Anthropic's docs recommend `@AGENTS.md`
  as the canonical pattern. (See
  <https://code.claude.com/docs/en/memory#agents-md>.)
- Gemini CLI reads `GEMINI.md` and supports `@file.md` imports with
  relative or absolute paths. (See
  <https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md>.)
- GitHub Copilot reads `AGENTS.md` **natively** — the nearest one in the
  directory tree wins — so it needs no stub. Its legacy
  `.github/copilot-instructions.md` accepts only inline Markdown with
  **no import syntax**, so it can't point at AGENTS.md; treat it as a
  content source to drain, not a stub. (See
  <https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot>.)

So `CLAUDE.md → @AGENTS.md` and `GEMINI.md → @AGENTS.md` give both tools
the same content without duplication, while Copilot picks up AGENTS.md
directly.

## Bootstrap template (the rubric)

This is **both** the template for fresh files and the scoring rubric for
choosing between existing files. A good AGENTS.md covers exactly three
things:

1. **WHY** — what is this project and what problem does it solve?
1. **WHAT** — repo structure, language boundaries, key entry points.
1. **HOW** — commands to build/test/lint, plus gotchas not discoverable
   from code alone.

Point to docs; don't repeat them. Everything else (architecture, API
surfaces, coding style) is discoverable via tools, MCPs, skills, and
reading the code. Keep it under 200 lines — both tools load these files
in full at session start, and longer files reduce adherence.

When the project has a `CONTEXT.md` (or `CONTEXT-MAP.md`) domain glossary,
open AGENTS.md with a short **Domain Language** section pointing to it, so
agents consult the canonical terms before reusing overloaded words. Point
to the glossary; never copy it in. Skip the section when no such file
exists.

Template below — the overloaded words are a placeholder. Replace them
with the terms this project's `CONTEXT.md` actually flags as overloaded;
if the glossary names none, drop the "such as …" clause.

```markdown
## Domain Language

Canonical domain terms and their relationships live in `CONTEXT.md`.
Consult it before introducing new terminology or reusing overloaded
words such as "active", "domain", or "activation".
```

## Inputs

Operate on the project root where the skill is invoked. The relevant
files:

- `AGENTS.md` (canonical target)
- `CLAUDE.md` (Claude Code pointer)
- `GEMINI.md` (Gemini CLI pointer)
- `.github/copilot-instructions.md` (GitHub Copilot legacy source — a
  content source to consolidate, never a stub; see "GitHub Copilot")

"Substantive content" means more than boilerplate or an import line. A
file whose only non-whitespace content is `@AGENTS.md`
is a stub, not content.

## Decision table

Inventory what is present and substantive, then follow the matching row.

| AGENTS.md | CLAUDE.md | GEMINI.md | Action                                                                                                                                   |
| --------- | --------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| none      | none      | none      | **Bootstrap** — create AGENTS.md from scratch using the rubric, then stub both pointers                                                  |
| content   | none      | none      | Create stub CLAUDE.md and GEMINI.md that import AGENTS.md                                                                                |
| content   | stub      | stub      | **Update/Audit** — already canonical; run "Update mode" below                                                                            |
| content   | content   | any       | **Score and merge** — see "Picking the canonical source" below                                                                           |
| content   | any       | content   | **Score and merge** — see "Picking the canonical source" below                                                                           |
| none      | content   | none      | **Score** CLAUDE.md against the rubric; promote (or rewrite to match) → AGENTS.md, then stub both pointers                               |
| none      | none      | content   | **Score** GEMINI.md against the rubric; promote (or rewrite to match) → AGENTS.md, then stub both pointers                               |
| none      | content   | content   | **Score both** against the rubric; pick the one that scores higher as the base, backfill missing sections from the other, then stub both |

`.github/copilot-instructions.md` sits outside this table — it is never
a stub. If it holds substantive content, fold it into AGENTS.md per
"GitHub Copilot" below; otherwise ignore it.

## Picking the canonical source

When more than one file is in the running — including a substantive
`.github/copilot-instructions.md` — score each candidate against the
rubric:

1. **Rubric coverage** — WHY, WHAT, HOW. Each present, accurate, and
   non-stale scores a point; missing or wrong scores zero.
1. **Orientation focus** — points to docs rather than duplicating them,
   and stays within ~200 lines.
1. **Freedom from tool-specific noise** — generic guidance (structure,
   build commands, conventions) scores higher than tool-specific
   features (Claude skills, plan mode, Gemini checkpointing/sandbox,
   Copilot coding-agent settings). Tool-specific content is fine, but
   lives in the stub, not in AGENTS.md.

The **highest-scoring file becomes the base**. Backfill missing rubric
sections from the others. Peel anything tool-specific into the matching
stub under `## Claude Code` or `## Gemini CLI`; Copilot-specific
guidance stays in `.github/copilot-instructions.md` (see "GitHub
Copilot"). If two candidates score roughly equal, show the user a short
diff summary and ask which should be canonical before writing.

## Stub templates

### CLAUDE.md

The import line is the only required content. Append any Claude-specific
guidance **after** the import under a dedicated heading.

```markdown
@AGENTS.md
```

With Claude-specific additions:

```markdown
@AGENTS.md

## Claude Code

<Claude-specific notes here>
```

### GEMINI.md

Gemini's import example uses the `@path` form; use `@AGENTS.md` for
parity with CLAUDE.md.

```markdown
@AGENTS.md
```

With Gemini-specific additions:

```markdown
@AGENTS.md

## Gemini CLI

<Gemini-specific notes here>
```

## GitHub Copilot

Copilot has no stub. It reads `AGENTS.md` natively, so once content is
canonical Copilot picks it up with no extra file. Handle
`.github/copilot-instructions.md` by what it holds:

- **Substantive content** — score and merge it into AGENTS.md like any
  other candidate (see "Picking the canonical source"), then reduce the
  file to genuinely Copilot-specific guidance or delete it. It cannot
  `@`-import AGENTS.md, so never leave an import line in it.
- **Absent or already thin** — leave it; native AGENTS.md support covers
  Copilot.

If an org mandates the file exist, make it a short prose pointer plus
any Copilot-specific notes — a pointer in prose, not an import:

```markdown
The canonical project instructions live in `AGENTS.md`; read that file.

<Copilot-specific notes here>
```

## Update mode

The file is already canonical. Run all three jobs in sequence, then gate
all proposed changes behind a single confirmation — write nothing before
the user approves. With `--learn`, run **only** job 3 and skip jobs 1
and 2 (still gate behind one confirmation).

1. **Structure audit** — score the existing AGENTS.md against the rubric
   (above); do not restate it. Flag missing or malformed WHY/WHAT/HOW
   sections, a missing **Domain Language** pointer when a
   `CONTEXT.md`/`CONTEXT-MAP.md` exists, length creeping past ~200 lines,
   and tool-specific content that has leaked in from a stub (it belongs
   under `## Claude Code` / `## Gemini CLI`). Also flag substantive
   content that has accumulated in `.github/copilot-instructions.md`; it
   should be folded back into AGENTS.md (see "GitHub Copilot"). Propose
   concrete fixes.
1. **Freshness check** — verify the WHAT/HOW claims against the repo
   using read-only tools. Confirm the build/test/lint commands exist
   (cross-check `Makefile`, `package.json` scripts, or equivalent), that
   documented entry points and structure still match, and that listed
   gotchas still apply. Flag anything stale or wrong, and cite what you
   checked. On a large repo, run this as a read-only subagent (or one per
   claim class) that returns a findings list — review-only; do not modify
   code or run tools that change state. It feeds the confirmation gate
   below; it edits nothing.
1. **Session-lessons harvest** — review the current session for durable,
   non-obvious facts that fit WHY/WHAT/HOW: a gotcha that cost time, a
   non-obvious command, a constraint not discoverable from the code.
   Exclude anything a reader could learn from the code. If nothing
   qualifies, skip — do not force it.

Then present the combined diff or a short summary and **write only after
the user confirms**. Keep AGENTS.md under ~200 lines and tool-agnostic.
After writing, run the Verification checklist.

## Verification

After writing, confirm:

1. `AGENTS.md` matches the rubric (WHY / WHAT / HOW, under ~200 lines,
   tool-agnostic).
1. If a `CONTEXT.md`/`CONTEXT-MAP.md` exists, `AGENTS.md` opens with a
   **Domain Language** section pointing to it (not copying it).
1. `CLAUDE.md` begins with `@AGENTS.md` on its first non-empty line.
1. `GEMINI.md` begins with `@AGENTS.md` on its first non-empty line.
1. `.github/copilot-instructions.md`, if present, holds no substantive
   content missing from AGENTS.md and contains no import line.
1. No content lives **only** in `CLAUDE.md`, `GEMINI.md`, or
   `.github/copilot-instructions.md` unless it is genuinely
   tool-specific.

Report the final state to the user as a short summary — which file is
canonical, what was moved, what was created.

## Guidelines

- Reconcile/Bootstrap is one-shot — don't re-run it once the three files
  are canonical. Update mode is the re-runnable path: use it when you
  suspect AGENTS.md has drifted from the repo, or at the end of a
  session that surfaced durable lessons.
- Preserve the user's voice. When merging, keep original wording rather
  than rewriting for style.
- Never delete content without confirming the user is okay losing it. If
  in doubt, keep both versions in AGENTS.md and flag the overlap.
- Wrap all Markdown output at 80 columns.
