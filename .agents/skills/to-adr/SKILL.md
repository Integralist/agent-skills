---
name: to-adr
description: >-
  Extract an Architecture Decision Record (ADR) from an implementation plan
  or discussion. Use when recording an architectural decision with rejected
  alternatives.
allowed-tools: Bash(git config:*), Bash(date:*), Glob, Read, Write
---

# To ADR

Capture a **decision** — a fork that constrains future work, with the
alternatives rejected and the consequences that follow. This skill records
decisions only: the product-facing *what & why* goes to
[`to-prd`](../to-prd/SKILL.md), the engineering source-of-truth to
[`to-spec`](../to-spec/SKILL.md).

Normally invoked by [`to-plan`](../to-plan/SKILL.md) after a plan is
written; also runs standalone.

## Input

1. Path given as an argument → use it.
1. Invoked from another skill that passes a path → use that.
1. Otherwise → most recently modified plan in `projects/` (e.g.
   `projects/*/plan.md`); if ambiguous, ask which.

Read the source in full before extracting.

## Value gate

Produce an ADR only for a **genuine decision with a real alternative rejected
for a stated reason**. Mechanical changes, single-obvious-way tasks, and
maintenance work have no fork to record — for those, **produce nothing**: state
why ("no architectural decision with a rejected alternative") and stop. Never
emit an all-placeholder template.

A single plan often holds several distinct decisions — produce **one ADR per
decision**, not one giant ADR.

> [!NOTE]
> Direct `/to-adr` invocation lowers the bar: skip only if the ADR would be
> entirely placeholder, but honour a borderline case the user explicitly asked
> for. The strict gate is for **automatic** invocation from `to-plan`.

## Write the ADR(s)

Follow the repo-wide naming, numbering, and registry rules in
[`ADR-FORMAT.md`](../domain-modeling/ADR-FORMAT.md).

For ADRs under `projects/<project-slug>/`, ensure the project's `README.md`
exists. If missing, create it from
[`../shared/PROJECT-README.md`](../shared/PROJECT-README.md), then add or
update each ADR in its artifact table.

Write each ADR as `ADR-<NNNN>.md` in its destination directory:

- Project or initiative decisions: `projects/<project-slug>/ADR-<NNNN>.md`.
- System-wide decisions: `docs/adr/ADR-<NNNN>.md`.

Before writing a new ADR, run the legacy-file migration in
[`ADR-FORMAT.md`](../domain-modeling/ADR-FORMAT.md). Update repository-local
links and cross-references, project READMEs, and the index with each rename.
Stop and ask if legacy ADRs have conflicting IDs or their status is unclear;
tell the user that external links to renamed paths may need manual updates.

After migration, read `docs/adr/README.md` if it exists; otherwise create it
from the migrated ADR inventory. Scan the repository for `ADR-<NNNN>.md` files,
including those under `projects/` and context-specific directories. The
sequence is repository-wide: use one greater than the highest ID found in the
index or the files. Assign consecutive IDs in source order when one plan yields
multiple ADRs. Add each new ID, concise summary, and link to the index in the
same change.

The index is a registry, not a reservation system. IDs in an open PR are
provisional. After updating from the target branch, check for collisions; if
another PR has merged the same ID, assign this PR's ADR the next available ID
and update its filename, references, project README, and index before merge.
Never renumber or reuse IDs after they have merged.

Set **Date** from `date +%F` and **Deciders** from `git config user.name`.

Template — Nygard skeleton with mandatory **Options Considered**:

````markdown
# {Short decision title}

- **Status**: Accepted
- **Date**: {YYYY-MM-DD}
- **Deciders**: {git config user.name}

## Context

{The forces at play: problem, constraints, requirements that make
this decision necessary. Factual, citation-backed.}

## Decision

{The choice made, in active voice: "We will …".}

## Options Considered

{Every option on the table, chosen one included. For each: a
one-line summary, then why it won or was rejected.}

- **{Option A (chosen)}** — {why it won}
- **{Option B}** — {why rejected}

## Consequences

{What becomes easier and what becomes harder. Follow-on work, new
constraints, risks.}
````

Use `Accepted` for a committed decision, `Proposed` while the plan is still
tentative.

When a plan yields several decisions, this is a
[verified-pattern fan-out](../shared/SUBAGENT-STEERABILITY.md): draft the
**first** ADR, confirm its shape with the user, then fan out subagents to draft
the rest — one per decision, each passed only its decision and the approved
skeleton. The value gate above still applies per decision.

## Report

List the files created and give a one-line summary of each decision recorded.

## Guidelines

- Extract; do not invent. Every statement traces to the source plan or its
  cited research. Missing input for a section → write
  `_Not specified in source._`, never fabricate.
- Cross-link the source plan, and the PRD or spec where relevant.
- Follow [`conventions-markdown`](../conventions-markdown/SKILL.md) and omit
  needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
