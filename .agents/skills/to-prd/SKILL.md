---
name: to-prd
description: >-
  Write a PRD that frames a feature's goals, users, and success metrics for
  stakeholders, from a spec, plan, or this session's discussion. Use when an
  engineering-led project needs product framing its spec doesn't give.
argument-hint: "[source path | github | #<issue>]"
allowed-tools: Bash(git config:*), Bash(date:*), Bash(gh issue:*), Bash(gh label:*), Glob, Read, Write
metadata:
  model-tier: complex
---

Turn a spec, plan, or this session into stakeholder-facing `prd.md`: the
problem, goals, users, and success measures. A PRD frames rather than restates
the spec; implementation belongs in the plan and ADRs. Extract; do not invent.

**Stop and ask.** Follow the source. If anything is missing, contradictory,
or points to a wrong design, tell the user and wait; do not guess.

**Workflow.**

1. **Choose and read the source.** Use the file named by the user or calling
   skill; otherwise use this session's discussion. Read it in full, including
   its linked spec and plan. For `github` or an issue reference (`#<n>` or URL),
   read and follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub
   Issues and Issue Artifacts instead of `projects/`.
2. **Check that a PRD adds value.** Write nothing; explain why if PDD
   documents (`project.md`, `discovery*.md`, `design*.md`) already frame the
   product, the work has no product surface (e.g. refactor, tooling, docs), or
   the PRD would only paraphrase the spec's problem, solution, and user stories.
   Continue only if the source adds goals,
   metrics, audience, or non-goals missing from the spec.
3. **Write the PRD.** Read [PRD-TEMPLATE.md](references/PRD-TEMPLATE.md)
   and use it in the source's project folder or a new
   `projects/<yyyy-mm-dd>-<slug>/`. Read
   [voice-product](../voice-product/SKILL.md) before drafting. Set Status to
   `Draft`; fill Author and Created with `git config user.name` and `date +%F`.
   Trace every statement to the source; where it is silent, write
   `_Not specified in source._` Before indexing, read
   [PROJECTS-README.md](../shared/PROJECTS-README.md) and add the PRD to the
   project README as described.

**Done when** the file is written and the user has its path.
