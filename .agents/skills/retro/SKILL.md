---
name: retro
description: >-
  Conduct a retrospective on a coding session to improve agent ergonomics and
  reduce friction. Use when a session ran slow, hit repetitive errors, or had
  tool or context friction.
disable-model-invocation: true
---

# Retro

Conduct a retrospective on a coding session to suggest improvements to the
coding agent's **environment** and eliminate recurring friction in future runs.

## Steps

1. Review [`writing-for-agents`](../writing-for-agents/SKILL.md) for style and
   instruction design rules.
2. Read the primary sources for the specified session (inspect transcripts or
   session logs on this machine). Default to the current session if unspecified.
3. Audit the session across these candidate categories:
   - **Automated checks**: identify errors an automated check could catch. Read
     the repo's existing build and check commands first (e.g. `package.json`,
     `Makefile`, CI workflows). A check that exists but is unwired or broken is
     the primary finding. A repo lacking guardrails (no pre-commit hook or CI
     running lint/typecheck/test) is a standing missed opportunity.
   - **Coding standards**: classify violations as mechanical or judgment-based.
     A **mechanical** violation (syntax, banned API, import shape, file path)
     gets a deterministic check (linter rule, pre-commit hook, or CI job).
     Reserve `CODING_STANDARDS.md` or review guidelines strictly for genuine
     **judgment calls** (consistency with surrounding code, design taste).
   - **Navigation**: identify files that took excessive tool calls or time to
     locate. Propose explicit **navigation pointers** in `AGENTS.md` for hidden
     dependencies.
   - **Context budget**: audit `AGENTS.md` and steering files for bloat. Move
     operational rules out of `AGENTS.md` and into automated checks or review
     guidelines.
   - **No-ops**: remove steering instructions that fail to change agent behavior.
   - **Tool economy**: flag expensive or token-inefficient tool calls (e.g. broad
     grep patterns, repeated file reads, large shell dumps).
   - **Information access**: identify missing data feeds that forced the agent
     to guess (e.g. streaming dev server logs, read-only third-party access).
4. Present findings to the user ranked by severity with concrete next steps.

## Reference

### Implementation vs. Review

Work divides into two distinct stages:

- **Implementation agent**: experiences high context pressure (exploration,
  code generation, debugging). Keep steering minimal here.
- **Review agent**: experiences low context pressure (receives a diff, needs
  no exploration). Assign coding standards and style enforcement to review time,
  not implementation time.

### Target Files

- `AGENTS.md` / `CLAUDE.md`: always in context. Use sparingly, prioritizing
  navigation pointers over rules.
- `CODING_STANDARDS.md`: read during review, not implementation. Add navigation
  pointers if it exceeds 1,000 lines.
- `docs/`: reference files loaded on demand via pointers.
- `skills/`: procedural workflows or reference loaded when invoked.
