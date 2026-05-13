---
name: research-plan
description: >-
  Two-phase workflow: research topics deeply, then create
  implementation plans. Bootstraps CLAUDE.md, produces
  docs/research/ reference docs, and docs/plans/
  implementation guides. Also handles repo-by-name research.
  Use when the user wants to research a topic, explore a
  repo, create a project plan, or says /research-plan.
---

# Research & Plan

Two-phase skill: **research** first, then **plan**. Research
produces deep reference documents; plans consume those documents
to produce precise implementation guides.

## Phase 0: Bootstrap project instructions

Before anything else, delegate to the [`agents-md`](../agents-md/SKILL.md)
skill. It reconciles `AGENTS.md`, `CLAUDE.md`, and
`GEMINI.md` so `AGENTS.md` is canonical and the other two
are thin `@AGENTS.md` pointers — bootstrapping any that
are missing.

Run that skill to completion, then prompt the user:

```txt
What do you want researched?
```

## Phase 1: Research

### Detect research mode

Determine which mode to use based on the user's input:

| Input                                    | Mode              |
| ---------------------------------------- | ----------------- |
| GitHub URL (`https://github.com/o/r`)    | **Code research** |
| `org/repo` or bare repo name             | **Code research** |
| Topic, concept, or question              | **Topic research**|

### Check for existing research

Before starting new research in either mode, scan
`docs/research/` for documents that already cover the topic or
repo.

- **Exact or near match found**: Read the document. If it
  already covers what the user needs, skip to the "After
  research completes" prompt. If it covers the topic partially,
  extend it.
- **No match found**: Proceed with the appropriate research
  mode below.

### Mode A: Code research (repo by name or URL)

Use this mode when the user references a specific repository.

#### Parse input

Extract `{org}` and `{repo}` from the argument:

1. **GitHub URL** — strip `https://github.com/` prefix, split
   on `/` to get `{org}` and `{repo}`. Remove any trailing
   `.git`.
1. **`org/repo` form** — split on `/`.
1. **Bare repo name** — no `/` present; `{org}` is unknown.

#### Locate locally

1. If `{org}` is known, check whether `~/code/{org}/{repo}`
   exists.
1. If only a bare name, search `~/code/*/{repo}` for a
   matching directory.
   - If exactly one match is found, use it.
   - If multiple matches are found, list them and ask the user
     which one to use.
   - If no match is found, ask the user for the org (or full
     URL) so you can clone it.

#### Clone if missing

If the repo is not found locally and `{org}` is known:

```bash
gh repo clone {org}/{repo} ~/code/{org}/{repo}
```

#### Gather project metadata

Run the following git commands inside the repo directory to
build a diagnostic snapshot. Capture the output and include it
in the subagent prompt as context.

**Churn hotspots** — most-changed files in the last year:

```bash
git -C {repo_path} log --format=format: --name-only \
  --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
```

**Bus factor** — contributors ranked by commit count:

```bash
git -C {repo_path} shortlog -sn --no-merges
```

Also check recent activity (last 6 months) to flag absent top
contributors:

```bash
git -C {repo_path} shortlog -sn --no-merges \
  --since="6 months ago"
```

**Bug clusters** — files most often touched in bug-fix commits:

```bash
git -C {repo_path} log -i -E --grep="fix|bug|broken" \
  --name-only --format='' \
  | sort | uniq -c | sort -nr | head -20
```

**Commit velocity** — commits per month:

```bash
git -C {repo_path} log --format='%ad' \
  --date=format:'%Y-%m' | sort | uniq -c
```

**Crisis patterns** — reverts, hotfixes, and rollbacks:

```bash
git -C {repo_path} log --oneline --since="1 year ago" \
  | grep -iE 'revert|hotfix|emergency|rollback'
```

**Cross-reference**: Files that appear in **both** churn
hotspots and bug clusters are the highest-risk code. Flag
these explicitly.

#### When in doubt, ask

Do not guess. If any of the following are unclear, stop and ask
the user before proceeding:

- The input is ambiguous
- You aren't sure what the user wants to know about the repo
- The clone would go to an unexpected location
- The repo doesn't exist on GitHub (clone fails)

#### Spawn a subagent for code research

Spawn a single subagent (general-purpose / workhorse role). The
subagent prompt must include:

- The repo path (`~/code/{org}/{repo}`)
- The user's question or research goal
- The **project metadata** gathered above — instruct the
  subagent to use this metadata to prioritize which code to
  read first
- Instructions to use file reading, search, and exploration
  patterns to investigate the codebase
- Instructions to note any stale `docs/**/*.md` or
  `**/README.md` files discovered during research

#### Save findings

Write findings to `docs/research/{repo}.md` (new file) or
extend the existing document. The document must include a
**Project Metadata** section at the top with the git diagnostic
snapshot.

Use the same research template shown in Mode B below.

#### Present findings

Summarize the research to the user, note where the full
document was saved, then proceed to the "After research
completes" prompt.

### Mode B: Topic research

Use this mode for concepts, technologies, patterns, or anything
that isn't a specific repo.

#### Conduct research

Take the user's topic and study it deeply. Use every tool at
your disposal: read source code, explore the codebase, fetch
documentation, search the web, and check sibling repositories
in the parent directory (`../`) for relevant reference
implementations or prior art.

### Output

Write to `docs/research/<topic-slug>.md` (new file) or extend
the existing document.

Use this template:

```markdown
# {Topic}

## Overview

{What this is and why it matters — one or two paragraphs.}

## Key Concepts

{Core abstractions, terminology, and mental models.}

## Architecture / How It Works

{Internal structure, data flow, component relationships.
Use Mermaid diagrams for complex systems.}

## API Surface / Interface

{Public API, configuration options, CLI flags — whatever
the consumer interacts with.}

## Gotchas & Edge Cases

{Surprising behavior, common mistakes, undocumented
limitations.}

## Trade-offs

{Design decisions and their consequences. What was chosen
and what was given up.}

## References

{Links to source files, external docs, RFCs, issues.}
```

### After research completes

Notify the user that research is done, then present two options:

1. **Research another topic** — ask what to research next and
   loop back to Phase 1.
1. **Create a plan** — proceed to Phase 2.

## Phase 2: Plan

Ask the user what they want to build.

### Detect programming language

Auto-detect the project's primary language(s) by examining file
extensions and build files. Present the detected language to the
user for confirmation:

```txt
Detected language: Go. Is that correct, or should I use
a different language for the code snippets?
```

### Gather context

Read all `docs/research/*.md` files for context. These are the
foundation for the plan.

### Plan document

Write a detailed implementation guide to
`docs/plans/<plan-slug>.md`.

Use this template:

````markdown
# {Plan Name}

- **Status**: Planning
- **Author**: {author from git config}
- **Created**: {YYYY-MM-DD}
- **Language**: {confirmed language}

## Summary

{What needs to be built and why — one paragraph.}

## Research

This plan draws from the following research documents:

- [topic-a](../research/topic-a.md)
- [topic-b](../research/topic-b.md)

## Prerequisites & Dependencies

{External services, libraries, tools, or configuration
required before implementation begins.}

## Implementation Tasks

### Phase 1: {Phase Name}

- [ ] **Task 1.1**: {Specific task description}

  {Detailed implementation notes with code snippets:}

  ```{language}
  // Example code showing the approach
  ```

- [ ] **Task 1.2**: {Specific task description}

### Phase 2: {Phase Name}

- [ ] **Task 2.1**: {Specific task description}

### Phase N-1: Documentation

- [ ] **Task (N-1).1**: Update `**/README.md` files for
  packages whose public API changed
- [ ] **Task (N-1).2**: Update `docs/**/*.md` for user-facing
  behavior changes

### Phase N: Verification

- [ ] **Task N.1**: {How to test end-to-end}

## File Changes

| File           | Change                         |
| -------------- | ------------------------------ |
| `path/to/file` | {Brief description of changes} |

## Parallel Execution

This section defines how to split implementation across
subagents for parallel work.

### Subagent Roles

| Subagent Role             | Responsibility                    |
| ------------------------- | --------------------------------- |
| {Role description}        | {What this subagent owns}         |
| {Role description}        | {What this subagent owns}         |

### Work Streams

Group tasks into independent work streams that can run
in parallel. Each stream is assigned to a subagent role.

**Stream 1 — {Stream Name}** ({role description})

- Task {X.Y}
- Task {X.Z}

**Stream 2 — {Stream Name}** ({role description})

- Task {X.Y}
- Task {X.Z}

### Synchronization Points

List points where streams must wait for each other
before proceeding. Reference specific task IDs.

| Sync Point           | Blocked Stream | Waiting On     |
| -------------------- | -------------- | -------------- |
| {e.g., API contract} | {stream 2}     | {stream 1}     |

## Notes & Caveats

- {Edge cases, decisions, risks, or open questions.}
````

### Parallel execution section

When filling in the Parallel Execution section:

1. **Identify independent work streams.** Look for tasks that
   touch different files, packages, or layers with no shared
   state. These can run in parallel.
1. **Define subagent roles by stream, not by task.** Each
   subagent should own a coherent slice of the system, not a
   grab-bag of unrelated tasks.
1. **Minimize synchronization points.** Prefer designs where
   streams share a contract (interface, schema, API spec)
   agreed up front so they can work independently.
1. **Keep the team small.** Two to four subagents is typical.
   More subagents means more coordination overhead.
1. **Make execution instructions concrete.** The plan will be
   handed to an AI agent later. The instructions must be
   specific enough to follow mechanically.

### After plan completes

Notify the user that the plan is done, then present two options:

1. **Research another topic** — loop back to Phase 1.
1. **Create another plan** — loop back to the Phase 2 prompt.

## Guidelines

- Use specific file paths and line numbers when referencing
  code.
- Every factual claim in a research document must be cited
  inline — `path/to/file.go:42` for code, URL for external
  docs. Claims you cannot cite must be labelled "unverified
  assumption" and include how to verify them.
- Break work into logical phases (usually by component or
  layer).
- Each task should be small enough to complete in one session.
- Include a verification phase with concrete test commands.
- Code snippets should be precise — real function signatures,
  real types, real import paths. Not pseudocode.
- Research documents should be exhaustive. Plans should be
  actionable.
- Wrap all Markdown output at 80 columns.
