---
name: agents-md
description: >-
  Make AGENTS.md the canonical project-instructions file and
  ensure CLAUDE.md and GEMINI.md are thin pointers that
  @-import it. Promotes existing CLAUDE.md/GEMINI.md content
  into AGENTS.md when AGENTS.md is missing or weaker,
  creates stub CLAUDE.md and GEMINI.md when absent, and
  bootstraps a fresh AGENTS.md when the project has no
  instructions file at all. Use when the user wants to
  tidy up agent instructions, onboard a project, or says
  /agents-md.
---

# Agents-MD

Reconcile project-instructions files so that **AGENTS.md is
canonical** and `CLAUDE.md` / `GEMINI.md` are thin stubs
that `@`-import it. This way the same project is usable
from Claude Code, Gemini CLI, or any other agent that
honours `AGENTS.md`, with no duplicated content.

## Why this works

- Claude Code reads `CLAUDE.md`, not `AGENTS.md`, but
  `CLAUDE.md` supports `@path` imports, and Anthropic's
  own docs recommend `@AGENTS.md` as the canonical pattern
  for shared instructions. (See
  <https://code.claude.com/docs/en/memory#agents-md>.)
- Gemini CLI reads `GEMINI.md` and supports `@file.md`
  imports with relative or absolute paths. (See
  <https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md>.)

So `CLAUDE.md → @AGENTS.md` and `GEMINI.md → @./AGENTS.md`
give both tools the same content without duplication.

## Bootstrap template (the rubric)

The Bootstrap template defines what "good" looks like for
AGENTS.md. It is **both** the template for fresh files and
the scoring rubric when choosing between existing files.

A good AGENTS.md covers exactly three things:

1. **WHY** — What is this project and what problem does it
   solve?
1. **WHAT** — Repo structure, language boundaries, key
   entry points.
1. **HOW** — Commands to build/test/lint, plus gotchas
   that cannot be discovered from code alone.

Point to docs; don't repeat them. Everything else
(architecture, API surfaces, coding style) is discoverable
via tools, MCPs, skills, and reading the code.

Keep it under 200 lines — both Claude Code and Gemini CLI
load these files in full at session start, and longer
files reduce adherence.

## Inputs

Operate on the current project root — the directory where
the skill is invoked. The relevant files are:

- `AGENTS.md` (canonical target)
- `CLAUDE.md` (Claude Code pointer)
- `GEMINI.md` (Gemini CLI pointer)

"Substantive content" means more than boilerplate or an
import line. A file whose only non-whitespace content is
`@AGENTS.md` or `@./AGENTS.md` is already a stub, not
content.

## Decision table

Inventory what is present and substantive, then follow the
matching row.

| AGENTS.md | CLAUDE.md | GEMINI.md | Action                             |
| --------- | --------- | --------- | ---------------------------------- |
| none      | none      | none      | **Bootstrap** — create AGENTS.md from scratch using the rubric, then stub both pointers |
| content   | none      | none      | Create stub CLAUDE.md and GEMINI.md that import AGENTS.md |
| content   | stub      | stub      | Leave everything alone; report "already reconciled" |
| content   | content   | any       | **Score and merge** — see "Picking the canonical source" below |
| content   | any       | content   | **Score and merge** — see "Picking the canonical source" below |
| none      | content   | none      | **Score** CLAUDE.md against the rubric; promote (or rewrite to match) → AGENTS.md, then stub both pointers |
| none      | none      | content   | **Score** GEMINI.md against the rubric; promote (or rewrite to match) → AGENTS.md, then stub both pointers |
| none      | content   | content   | **Score both** against the rubric; pick the one that scores higher as the base, backfill missing sections from the other, then stub both |

## Picking the canonical source

When more than one file is in the running (e.g. AGENTS.md
and CLAUDE.md both have content, or CLAUDE.md and GEMINI.md
both have content and AGENTS.md is missing), score each
candidate against the Bootstrap template's rubric:

1. **Rubric coverage** — does it have WHY, WHAT, and HOW?
   Each present, accurate, and non-stale section scores a
   point; missing or wrong sections score zero.
1. **Orientation focus** — does it point to docs rather
   than duplicate them? Does it stay within ~200 lines?
1. **Freedom from tool-specific noise** — generic guidance
   (project structure, build commands, conventions) scores
   higher than tool-specific features (Claude skills, plan
   mode, Gemini checkpointing/sandbox). Tool-specific
   content is fine, but lives in the stub, not in AGENTS.md.

The **highest-scoring file becomes the base for AGENTS.md**.
Backfill any missing rubric sections from the other file(s).
Anything tool-specific gets peeled off into the matching
stub under `## Claude Code` or `## Gemini CLI`.

If two candidates score roughly equal, show the user a
short diff summary and ask which should be canonical before
writing.

## Stub templates

### CLAUDE.md

The import line is the only required content. If there is
Claude-specific guidance (e.g. "use plan mode under
`src/billing/`"), append it **after** the import under a
dedicated heading.

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

Gemini's import example uses the `@./path` form, so prefer
that for portability across the CLI and any Gemini tool
that follows the same convention.

```markdown
@./AGENTS.md
```

With Gemini-specific additions:

```markdown
@./AGENTS.md

## Gemini CLI

<Gemini-specific notes here>
```

## Verification

After writing, confirm:

1. `AGENTS.md` matches the Bootstrap rubric (WHY / WHAT /
   HOW, under ~200 lines, tool-agnostic).
1. `CLAUDE.md` begins with `@AGENTS.md` on its first
   non-empty line.
1. `GEMINI.md` begins with `@./AGENTS.md` on its first
   non-empty line.
1. No content lives **only** in `CLAUDE.md` or `GEMINI.md`
   unless it is genuinely tool-specific.

Report the final state to the user as a short summary —
which file is canonical, what was moved, what was created.

## Guidelines

- Don't re-run this skill on every session. It is a
  one-shot reconciliation. Once the three files are in the
  canonical shape, leave them alone until their content
  drifts.
- Preserve the user's voice. When merging, keep original
  wording rather than rewriting for style.
- Never delete content without confirming the user is okay
  losing it. If in doubt, keep both versions in AGENTS.md
  and flag the overlap.
- Wrap all Markdown output at 80 columns.
