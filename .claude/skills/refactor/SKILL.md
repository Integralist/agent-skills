---
name: refactor
description: >-
  Analyze an existing feature and produce a reimplementation plan
  focused on reducing complexity and fragmentation. Asks: "If we
  started over, what would we do differently?"
user-invocable: true
argument-hint: <feature or area to refactor>
---

# Refactor

Strategic refactoring skill. Investigates a feature in the current
codebase, identifies complexity and fragmentation, and produces a
reimplementation plan answering: "Knowing what we know now, if we
started from scratch, how would we do this differently?"

## Input

The argument is available as `$ARGUMENTS`. If empty, prompt:

```text
What feature or area do you want to refactor?
```

Parse the response into a short kebab-case slug (e.g.,
`auth-middleware`, `config-loading`) for use in team and file
names.

## Gather project metadata

Before spawning the investigation agent, run the following git
commands in the current working directory to build a diagnostic
snapshot. Capture the output of each command and include it in
the agent prompt as context.

### Churn hotspots — most-changed files in the last year

```bash
git log --format=format: --name-only --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
```

### Bus factor — contributors ranked by commit count

```bash
git shortlog -sn --no-merges
```

Also check for recent activity (last 6 months) to flag absent
top contributors:

```bash
git shortlog -sn --no-merges --since="6 months ago"
```

### Bug clusters — files most often touched in bug-fix commits

```bash
git log -i -E --grep="fix|bug|broken" \
  --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

### Commit velocity — commits per month

```bash
git log --format='%ad' --date=format:'%Y-%m' \
  | sort | uniq -c
```

### Crisis patterns — reverts, hotfixes, and rollbacks

```bash
git log --oneline --since="1 year ago" \
  | grep -iE 'revert|hotfix|emergency|rollback'
```

### Cross-reference

Files that appear in **both** the churn hotspots and the bug
clusters lists are the highest-risk code. Flag these explicitly
in the metadata passed to the agent.

## Create Team and Task

Create a team named `refactor-<slug>` with one task:

1. **Investigation** — deeply explore the feature, map its
   implementation, and identify complexity, fragmentation, and
   missing prerequisites

## Investigation Phase

Spawn a single `general-purpose` agent named `investigator` on
the team, assigned to the **Investigation** task. The agent
prompt must include:

- The feature or area to investigate
- The current working directory
- The **project metadata** gathered above (churn hotspots, bus
  factor, bug clusters, commit velocity, crisis patterns, and
  cross-referenced high-risk files) — instruct the agent to use
  this metadata to prioritize which code to investigate first
  and to corroborate its findings against the empirical data
- The investigation checklist below (include verbatim)
- Instructions to use `Read`, `Glob`, `Grep`, and any relevant
  MCP servers (e.g. `gopls` for Go — `go_search`,
  `go_file_context`, `go_package_api`)
- **Send findings back to team-lead via `SendMessage` and mark
  the task as completed when done**

### Investigation checklist

Include this verbatim in the agent prompt:

> You are a principal engineer performing a strategic code review.
> Your goal is to deeply understand a feature's implementation and
> answer: "If we were to reimplement this from scratch, what
> would we do differently?"
>
> **Map the implementation:**
>
> - Identify all files, functions, types, and interfaces involved
> - Trace the data flow and control flow end-to-end
> - Document the public API surface and internal boundaries
> - Note which packages/modules own which responsibilities
>
> **Identify complexity hotspots:**
>
> - Functions longer than 50 lines that do multiple things
> - Deep nesting (>3 levels)
> - High cyclomatic complexity
> - Complex conditionals or switch statements
> - Functions with many parameters (>4)
>
> **Identify fragmentation:**
>
> - Logic for the same concern scattered across multiple packages
> - Duplicated patterns that should be unified
> - Inconsistent abstractions (same concept modeled differently
>   in different places)
> - Leaky abstractions where internals bleed across boundaries
> - Orphaned helpers or utilities that belong closer to their
>   callers
>
> **Identify coupling issues:**
>
> - Circular or upward dependencies between packages
> - Concrete types used where interfaces would decouple
> - Shared mutable state or global variables
> - Tight coupling to external services without abstraction
>
> **Identify missing prerequisites:**
>
> - What interfaces, shared types, or abstractions should have
>   existed before this feature was built?
> - What test infrastructure (helpers, fixtures, fakes) is
>   missing?
> - What documentation or architectural decisions should have
>   been made first?
>
> **Structure your report as:**
>
> 1. **Implementation map** — files, types, and data flow
> 1. **Complexity hotspots** — ranked by severity
> 1. **Fragmentation issues** — ranked by impact
> 1. **Coupling issues** — ranked by risk
> 1. **Missing prerequisites** — what should have existed first
> 1. **Key insight** — the single most important thing to change

## Collect Results

When the agent reports back via `SendMessage`, acknowledge
receipt and send a `shutdown_request`. Then delete the team.

## Analysis

Synthesize the investigation findings into a coherent
reimplementation strategy. Focus on:

- What the root causes of complexity are (not just symptoms)
- What the ideal decomposition looks like
- What order things should be built in (prerequisites first)
- What can be preserved vs. what needs rewriting

## Plan Output

Create the output directory with `mkdir -p docs/plans`, then
write the plan to `docs/plans/refactor-<slug>.md`:

````markdown
# Refactor: {Feature Name}

- **Status**: Planning
- **Author**: {author from git config}
- **Created**: {YYYY-MM-DD}
- **Language**: {detected language}

## Summary

{One paragraph: what is wrong with the current implementation
and the high-level reimplementation strategy.}

## Current State

{Brief description of the current implementation — key files,
data flow, and where the problems are. Include a Mermaid diagram
if the system is complex.}

## What We Should Have Done First

{Prerequisites that should have existed before this feature was
built — interfaces, shared types, test infrastructure,
architectural decisions.}

## Reimplementation Tasks

### Phase 1: Prerequisites

- [ ] **Task 1.1**: {Prerequisite work}

  {Detailed notes with code snippets:}

  ```{language}
  // Example code showing the approach
  ```

### Phase 2: {Core Reimplementation}

- [ ] **Task 2.1**: {Specific task}

### Phase N: Verification

- [ ] **Task N.1**: {How to verify behavior is preserved}
- [ ] **Task N.2**: {How to verify complexity is reduced}

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

## Notes & Caveats

- {Edge cases, risks, or open questions.}
````

Print a short summary and the file path in the conversation.

## Surface Durable Rules

After producing the plan, review the investigation findings for
**systemic patterns** that should be codified as ongoing
conventions or anti-patterns — guidance that applies beyond this
specific refactor.

Examples of durable rules:

- "Centralize validation in middleware, not in individual
  handlers"
- "Use interfaces at package boundaries, not concrete types"
- "Co-locate test helpers with the package they test"

### Process

1. If the investigation surfaced no durable lessons, skip this
   step entirely. Do not force it.

1. For each candidate rule, check `.claude/rules/` for an
   existing file that covers the topic. Update it if one exists.

1. If no existing file covers the topic, create a new
   `.claude/rules/<topic>.md` file.

1. **Present the proposed rule(s) to the user for confirmation
   before writing.** Example:

   ```text
   The investigation surfaced a pattern worth codifying:

   > Prefer interfaces at package boundaries to decouple
   > service layers from concrete implementations.

   Should I add this to .claude/rules/go.md (which already
   covers Go conventions), or skip it?
   ```

1. Only write after the user confirms.

## Guidelines

- Use specific file paths and line numbers when referencing
  code.
- Code snippets must use real function signatures, real types,
  real import paths. Not pseudocode.
- Break reimplementation into logical phases (prerequisites
  first, then core work, then verification).
- Each task should be small enough to complete in one session.
- The plan should describe a reimplementation, not incremental
  patches. The goal is "what would we do if starting over," not
  "what's the minimal diff."
- Include a verification phase with concrete test commands.
- Wrap all Markdown output at 80 columns.

## Prerequisites

### Claude Code agent teams (experimental)

The skill uses
[agent teams](https://code.claude.com/docs/en/agent-teams)
(`TeamCreate`, `SendMessage`, `Task` with `team_name`) to run
the investigation agent in parallel. Enable the feature by
adding the following to `.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
