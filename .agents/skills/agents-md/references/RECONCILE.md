# Reconcile instruction files

## Why imports work

Claude Code reads `CLAUDE.md`, supports `@path` imports, and
[recommends `@AGENTS.md`](https://code.claude.com/docs/en/memory#agents-md).
Gemini CLI reads `GEMINI.md` and
[supports `@file.md` imports](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md).
GitHub Copilot
[reads `AGENTS.md` natively](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot),
using the nearest file in the tree. Its legacy `.github/copilot-instructions.md`
has no import syntax: merge its content, never make it an import stub.

## Rubric and domain language

Use this rubric to create `AGENTS.md` and score candidates. Keep it under about
200 lines: tools load it at session start, and excess length lowers adherence.
Cover:

- **WHY:** what the project is and what problem it solves.
- **WHAT:** repository structure, language boundaries, key entry points.
- **HOW:** build, test, and lint commands; gotchas not evident from code.

Point to docs; omit what code or tools show (architecture, APIs, style). Read
project stewardship to capture direction under WHY and check for conflicts.

Use root `GLOSSARY.md` if present; otherwise, if root `CONTEXT.md` exists,
use it and warn with `⚠️` that it should be renamed `GLOSSARY.md`. When either
exists, open `AGENTS.md` with a pointer, never a copy. Name overloaded words
flagged by the glossary; omit “such as” when none are flagged. Consult it before
adding or reusing terminology. If neither exists, omit the pointer. Example:

````md
## Domain Language

Canonical domain terms and their relationships live in `GLOSSARY.md`.
Consult it before introducing new terminology or reusing overloaded
words such as "active", "domain", or "activation". If the project still
uses legacy `CONTEXT.md`, point to that existing file until it is renamed.
````

## Choose how to reconcile

Classify root `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` as substantive or stubs;
a file containing only `@AGENTS.md` or boilerplate is a stub. Check the
both-import case first; treat stubs as absent in other cases:

| AGENTS.md | Claude/Gemini files | Next step |
| --- | --- | --- |
| content | both import it | Already canonical; Update |
| content | one or both substantive | Score/merge into AGENTS; repair both |
| content | neither substantive | Keep; repair both stubs |
| absent/stub | neither substantive | Create from rubric; stub both |
| absent/stub | exactly one substantive | Promote/rewrite; stub both |
| absent/stub | both substantive | Score; higher base; backfill; stub both |

A substantive `.github/copilot-instructions.md` is another candidate and
overrides both “neither substantive” cases. Merge it into existing AGENTS; if
AGENTS is absent, score it for promotion. Score all candidates on current,
accurate WHY/WHAT/HOW (one point each), doc pointers, length near 200 lines,
and tool agnosticism. Use the highest scorer as base; backfill missing
sections. Move tool-specific guidance to matching files (Claude skills/plan
mode, Gemini checkpointing/sandboxing, Copilot-only content). For near ties,
show a short diff summary and ask the user which is canonical.

## Stubs and Copilot

`@AGENTS.md` is all Claude/Gemini stubs require; tool-specific notes may follow
under `## Claude Code` or `## Gemini CLI`:

````md
@AGENTS.md

## Claude Code

<Claude-specific notes here>
````

After merging, keep only genuinely Copilot-specific guidance in
`.github/copilot-instructions.md` or delete it; never add an import. Leave it
alone if absent or already thin. If the organization requires it, use this
prose pointer:

````md
The canonical project instructions live in `AGENTS.md`; read that file.

<Copilot-specific notes here>
````
