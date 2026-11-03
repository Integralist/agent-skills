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

## Keep only high-value guidance

Project facts belong in code, configuration, and project docs. `AGENTS.md` is
an instruction layer, not a second project summary. Keep only durable agent
guidance and important gotchas those sources don't capture. Link to the
authoritative source instead of repeating its facts, and retain a line only if
it could change an agent's decision or prevent a costly mistake. There is no
target length; 200 lines is a ceiling, not a goal.

Use WHY/WHAT/HOW as prompts, not required sections:

- **WHY:** non-obvious goals, non-goals, or priorities that change decisions.
- **WHAT:** unclear ownership or boundaries that code and docs don't resolve.
- **HOW:** costly gotchas or constraints not captured by code or config. Don't
  list commands already declared in the Makefile or package scripts.

Read project stewardship to identify direction not already stated in project
docs and check for conflicts.

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
AGENTS is absent, score it for promotion. Compare candidates by accurate,
durable guidance that is non-obvious from source and docs and likely to change
a decision or prevent a costly mistake. Don't reward length or complete
WHY/WHAT/HOW coverage, and don't backfill sections with facts already in
project docs. Use the candidate with the most high-value guidance as the base;
flag redundant content for the user's decision. Move tool-specific guidance to
matching files (Claude skills/plan mode, Gemini checkpointing/sandboxing,
Copilot-only content). For near ties, show a short diff summary and ask the
user which is canonical.

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

## Verify after any write

Confirm all five conditions:

1. `AGENTS.md` contains only durable, decision-relevant guidance not readily
   found in source or docs, and is tool-agnostic.
2. It opens with a Domain Language pointer when `GLOSSARY.md` or legacy
   `CONTEXT.md` exists.
3. `CLAUDE.md` and `GEMINI.md` each have `@AGENTS.md` on their first
   non-empty line.
4. `.github/copilot-instructions.md`, if present, has no import line and no
   content missing from `AGENTS.md`.
5. Only genuinely tool-specific content lives outside `AGENTS.md`.
