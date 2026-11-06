---
name: to-adr
description: >-
  Extract Architecture Decision Records from a plan, spec, or this session's
  discussion, one per decision that clears the value bar. Use when recording
  an architectural decision with rejected alternatives.
argument-hint: "[source path | github | #<issue>]"
allowed-tools: Bash(git config:*), Bash(date:*), Bash(git mv:*), Bash(gh issue:*), Bash(gh label:*), Glob, Read, Edit, Write
metadata:
  model-tier: complex
---

Extract ADRs from a plan, spec, or this session's discussion, one per
qualifying decision. Follow [ADR-FORMAT.md](../shared/ADR-FORMAT.md) before
screening, numbering, or writing; do not invent. If none qualify, write no
ADRs and explain why.

**Stop and ask.** Follow the source. If anything is missing, contradictory,
or points to a wrong design, tell the user and wait; do not guess.

**Workflow.**

1. **Choose the source.** Use the file named by the user or calling skill;
   otherwise use this session's discussion. Read it in full. For `github` or an
   issue reference (`#<n>` or URL), read and follow
   [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and Issue
   Artifacts instead of `projects/`.
2. **Screen decisions.** List each settled fork; keep only those passing all
   three ADR-FORMAT.md tests. Give each its own ADR with a rejected alternative
   and why it lost. For each dropped decision, identify the failed test.
3. **Number and place ADRs.** Follow ADR-FORMAT.md: migrate legacy files,
   then assign next repository-wide IDs in source order and choose each folder.
   Stop and ask if a collision or ambiguous legacy file blocks safe numbering.
4. **Write and index ADRs.** Use the shared template. Before indexing, read
   [PROJECTS-README.md](../shared/PROJECTS-README.md); add each ADR to
   `docs/adr/README.md` and project ADRs to the project README as described.

**Done when** all ADRs and indexes are written and you report each file with a
one-line summary, or explain why no decision warranted an ADR.
