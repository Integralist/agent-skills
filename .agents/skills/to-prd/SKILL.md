---
name: to-prd
description: >-
  Write a PRD that frames a feature's goals, users, and success metrics for
  stakeholders, from a spec, plan, or this session's discussion. Use when an
  engineering-led project needs product framing its spec doesn't give.
argument-hint: "[source path]"
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Read, Write
metadata:
  model-tier: complex
---

# To PRD

Turn a source (a spec, plan, or this session's discussion) into `prd.md`: the
problem, goals, users, and how success is measured, for a stakeholder
audience. A PRD frames the work; it doesn't restate the spec or carry the
*how*, which lives in the plan and ADRs. Extract; don't invent.

**Stop and ask.** Follow the source as given, but when something is missing,
contradictory, or looks like the wrong design, tell the user and wait. Don't
fill the gap with a guess.

1. **Pick the source.** Use the file the user or calling skill names. With
   none, use this session's discussion. Read it in full, with the spec and
   plan it links. Done when you know the feature, who it serves, and why.

2. **Check it earns a PRD.** Write nothing, and say why, when:

   - the project has PDD documents (`project.md`, `discovery*.md`,
     `design*.md`), which already frame the product: point to them instead;
   - the work has no product surface, such as an internal refactor, tooling,
     or docs;
   - the PRD would only paraphrase the spec's problem, solution, and user
     stories.

   Done when the source gives goals, metrics, audience, or non-goals the spec
   lacks.

3. **Write the PRD** to `prd.md` in the source's project folder, or a new
   `projects/<yyyy-mm-dd>-<slug>/`, filling the template below. Fill the
   header from `date +%F` and `git config user.name`, with Status `Draft`.
   Write it with the voice-product skill, and trace every statement to the
   source; where the source is silent, write `_Not specified in source._`.
   Add the PRD to the project README as
   [PROJECTS-README.md](../shared/PROJECTS-README.md) describes. Done when the
   file is written and you've shared its path.

````markdown
# {Feature} — PRD

- **Status:** Draft
- **Author:** {git config user.name}
- **Created:** {date +%F}
- **Source:** {[spec](./spec.md) or [plan](./plan.md)}

## Overview

{The problem and the proposed solution in one paragraph, without
implementation.}

## Problem

{Why this matters now, who is affected, and how.}

## Users & Use Cases

{Who uses this and the situations they need it for.}

## Goals

- {Measurable goal}

## Out of Scope (Non-Goals)

- {What is deliberately excluded}

## Functional Requirements

- The system must {observable behaviour}.

## Non-functional Requirements

- **{Characteristic}:** {constraint or target, such as performance, security,
  reliability, or compliance}

## Success Metrics

- {How success is measured}

## Open Questions

- {Unresolved decisions or risks}
````
