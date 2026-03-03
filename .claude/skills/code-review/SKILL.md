---
name: code-review
description: >-
  Code review using a team of specialized agents. Analyzes
  consistency, idiomatic Go, data correctness, and security.
  Works on PRs (/code-review <PR_URL>) or local code
  (/code-review, /code-review --diff, /code-review --uncommitted,
  /code-review path/to/file.go).
user-invocable: true
argument-hint: '[PR_URL | --diff | --uncommitted | path]'
---

# Code Review Skill

Review code using four specialized agents working in parallel.
Each agent focuses on a different review dimension. Works against
GitHub PRs or local code changes.

## Input

The argument is available as `$ARGUMENTS`. Detect the mode:

| Argument                      | Mode                                  |
| ----------------------------- | ------------------------------------- |
| PR URL or `owner/repo#number` | **PR mode**                           |
| `--diff` or no argument       | **Local: branch diff** vs main/master |
| `--uncommitted`               | **Local: uncommitted changes**        |
| File path or glob pattern     | **Local: explicit paths**             |

## PR Mode: Fetch Context

Use the GitHub MCP tools to fetch PR metadata and the full diff:

1. `mcp__github__pull_request_read` with `method: "get"`, `owner`,
   `repo`, `pullNumber` — returns title, body, base/head refs,
   additions, deletions
1. `mcp__github__pull_request_read` with `method: "get_files"`,
   `owner`, `repo`, `pullNumber` — returns the list of changed files
1. `mcp__github__pull_request_read` with `method: "get_diff"`,
   `owner`, `repo`, `pullNumber` — returns the full diff

## Local Mode: Gather Context

### Detect the default branch

Run these in order until one succeeds:

1. `git rev-parse --verify main` — use `main`
1. `git rev-parse --verify master` — use `master`
1. `git symbolic-ref refs/remotes/origin/HEAD` — parse the branch
   name from the output

Store the result as `DEFAULT_BRANCH`.

### Branch diff (default / `--diff`)

```bash
BASE=$(git merge-base HEAD "$DEFAULT_BRANCH")
git diff "$BASE"...HEAD
git diff --name-only "$BASE"...HEAD
```

### Uncommitted (`--uncommitted`)

```bash
# tracked changes (staged + unstaged)
git diff HEAD
git diff --name-only HEAD

# untracked files — list them, then read with the Read tool
git status --porcelain | sed -n 's/^?? //p'
```

For any untracked files listed above, read each one with the `Read`
tool and include its contents as additional context alongside the
diff.

### Explicit paths

For each provided path or glob pattern:

1. Expand globs using `Glob`
1. Read file contents using `Read`
1. If tracked, get the diff: `git diff HEAD -- <paths>`

### No changes

If the diff is empty and no files are found, report
"No changes to review" and stop.

### Large diffs

If the diff exceeds ~3000 lines, pass only the file list to agents
and instruct them to read files individually via `Read` rather than
embedding the entire diff in the prompt.

## Create Team and Tasks

Create a team named `code-review-<branch-or-context>` with four
tasks:

1. **Consistency Review** — naming patterns, code style consistency, error
   handling patterns, metric/label/logging consistency, structural consistency
   with existing codebase
1. **Idiomatic Go Review** — idiomatic Go as detailed in
   https://go.dev/doc/effective_go
1. **Data Consistency Review** — correctness of computations and state, race
   conditions in concurrent access, correct context/value propagation, resource
   lifecycle (leaks, double-close), appropriate data structure choices, error path
   completeness
1. **Security Review** — injection/cardinality attacks on labels or inputs,
   information leakage, unbounded reads or allocations, resource exhaustion,
   dependency security, timing side channels, authentication/authorization gaps

## Spawn Four Agents in Parallel

Spawn four `general-purpose` agents on the team, one per task. Each
agent prompt must include:

- The review dimension and what to focus on
- For the **Idiomatic Go Review** agent: instructions to MUST read
  https://go.dev/doc/effective_go for the full Effective Go guidelines before
  beginning the review
- The list of changed files
- **PR mode only:** `owner`, `repo`, `pullNumber`, the PR title,
  and the PR description — agents need these to call the GitHub
  MCP tools listed below

### PR mode agent instructions

- Use `mcp__github__pull_request_read` with `method: "get_diff"`, `owner`,
  `repo`, `pullNumber` for the full diff
- Use `mcp__github__get_file_contents` with `owner`, `repo`, `path`, and
  `ref: "refs/heads/<head-branch>"` to read full file context when needed

### Local mode agent instructions

- The diff is included directly in the agent prompt (unless the
  diff is too large — see "Large diffs" above)
- Use `Read`, `Glob`, `Grep` for file access when full context
  is needed beyond the diff

### All agents

- **DO NOT add comments to any PR. Send findings back to team-lead
  via SendMessage.**
- Mark their task as completed when done

## Collect Results

As each agent reports back via SendMessage, acknowledge receipt and
send a shutdown_request.

## Compile Summary

After all four agents have reported, delete the team.

### PR mode output

Present a consolidated review in the conversation:

```markdown
## PR #<number> Review Summary: "<title>"

**Overall assessment:** [1-2 sentence summary of PR quality]

### Actionable Items

Items worth discussing or changing, ordered by severity
(High/Medium/Low). Each item should include:
- The file and approximate line reference
- A code snippet if relevant
- Why it matters
- Suggestion for improvement

### Informational / No Action Needed

Brief bullet points for things that are fine or only worth noting
for awareness.
```

### Local mode output

Create the output directory with `mkdir -p docs/projects`, then
write the review to
`docs/projects/code-review-<YYYY-MM-DD-HHMM>.md`:

```markdown
## Code Review: <branch-name or "uncommitted" or path>

**Date:** YYYY-MM-DD HH:MM
**Mode:** branch-diff | uncommitted | paths
**Branch:** <branch-name>
**Base:** <merge-base-ref> (if applicable)
**Files reviewed:** <count>

### Actionable Items

[Same structure as PR mode — severity-ordered with file, line,
snippet, rationale, suggestion]

### Informational / No Action Needed

[Same structure as PR mode]
```

Print a short summary and the file path in the conversation.

Deduplicate findings across agents — if multiple agents flag the
same issue, combine them into a single item citing all relevant
perspectives.

## Notes

- The review is language-aware but optimized for Go codebases. The idiomatic Go
  agent uses the inlined Effective Go document at https://go.dev/doc/effective_go.
- For non-Go PRs, the idiomatic Go agent should be replaced with
  language-appropriate idiom checking, or omitted.
- All agents should read full file context (not just the diff) when needed to
  understand surrounding code patterns.
- The skill does not post any comments to the PR — all output stays in the
  conversation or in the local review file.

## References

- https://go.dev/doc/effective_go — Full Effective Go document used by the
  Idiomatic Go Review agent
