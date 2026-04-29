---
name: code-review
description: >-
  Code review using a team of specialized agents. Analyzes
  consistency, idiomatic Go, data correctness, security, and architecture.
  Works on PRs (/code-review <PR_URL>) or local code
  (/code-review, /code-review --diff, /code-review --uncommitted,
  /code-review path/to/file.go). Pass --plan or --plan=<path> to
  additionally check the diff against an implementation plan.
user-invocable: true
argument-hint: '[PR_URL | --diff | --uncommitted | path] [--plan[=<path>]]'
---

# Code Review Skill

Review code using six specialized agents working in parallel (seven with
`--plan`). Each agent focuses on a different review dimension. Works against
GitHub PRs or local code changes.

## Input

The argument is available as `$ARGUMENTS`. Detect the mode:

| Argument                      | Mode                                  |
| ----------------------------- | ------------------------------------- |
| PR URL or `owner/repo#number` | **PR mode**                           |
| `--diff` or no argument       | **Local: branch diff** vs main/master |
| `--uncommitted`               | **Local: uncommitted changes**        |
| File path or glob pattern     | **Local: explicit paths**             |

`--plan` (or `--plan=<path>`) is an orthogonal modifier that can be combined
with any of the modes above. When present, an additional Plan Adherence agent is
spawned. See "Plan mode" below.

## PR Mode: Fetch Context

Use the GitHub MCP tools to fetch PR metadata and the full diff. If any MCP call
fails (e.g., 403 SAML enforcement), fall back to the `gh` CLI equivalents shown
below.

### Primary: GitHub MCP

1. `mcp__github__pull_request_read` with `method: "get"`, `owner`, `repo`,
   `pullNumber` — returns title, body, base/head refs, additions, deletions
1. `mcp__github__pull_request_read` with `method: "get_files"`, `owner`, `repo`,
   `pullNumber` — returns the list of changed files
1. `mcp__github__pull_request_read` with `method: "get_diff"`, `owner`, `repo`,
   `pullNumber` — returns the full diff

### Fallback: `gh` CLI

1. `gh pr view <number> --repo <owner>/<repo> --json title,body,baseRefName,headRefName,additions,deletions`
1. `gh pr diff <number> --repo <owner>/<repo> --name-only`
1. `gh pr diff <number> --repo <owner>/<repo>`

## Local Mode: Gather Context

### Detect the default branch

Run these in order until one succeeds:

1. `git rev-parse --verify main` — use `main`
1. `git rev-parse --verify master` — use `master`
1. `git symbolic-ref refs/remotes/origin/HEAD` — parse the branch name from the
   output

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

For any untracked files listed above, read each one with the `Read` tool and
include its contents as additional context alongside the diff.

### Explicit paths

For each provided path or glob pattern:

1. Expand globs using `Glob`
1. Read file contents using `Read`
1. If tracked, get the diff: `git diff HEAD -- <paths>`

### No changes

If the diff is empty and no files are found, report "No changes to review" and
stop.

### Large diffs

If the diff exceeds ~3000 lines, pass only the file list to agents and instruct
them to read files individually via `Read` rather than embedding the entire diff
in the prompt.

## Plan mode (`--plan[=<path>]`)

When `--plan` is present in `$ARGUMENTS`, spawn an additional Plan Adherence
agent alongside the six standard agents. Do nothing extra when the flag is
absent.

### Locate the plan

Resolve the plan path in this order:

1. **Explicit** — `--plan=<path>` gives the plan path directly.
1. **PR body link** (PR mode only) — scan the PR body for a link to a file under
   `docs/plans/`. If found, use it.
1. **Newest plan** — pick the newest `docs/plans/*.md` by mtime, excluding
   `README.md` and anything under `docs/plans/completed/`.

If no plan is found, do not spawn the Plan Adherence agent and note "no plan
located, skipping plan adherence" in the summary.

### Plan Adherence task

Add a seventh task to the team:

- **Plan Adherence Review** — compare the diff against the plan document. Report
  (do not fail on):
  - **Unplanned files** — files in the diff not listed in the plan's File
    Changes table or referenced by a task
  - **Missing implementation** — tasks marked or implied as done in the plan,
    but not reflected in the diff
  - **Scope excess** — changes that exceed the plan's stated goal (refactors of
    adjacent code, rename sprees, unrelated fixes). Treat these as
    informational; the user may commit them separately by design.
  - **Plan drift** — changes that contradict the plan's stated approach
    (different file structure, different API shape)

The agent prompt must include:

- The plan file contents (read via `Read`)
- The diff and file list (same as other agents)
- Instruction: "Report findings; do not make judgment calls about whether scope
  excess is a problem. Let the user decide."
- Instruction: "Send findings to team-lead via `SendMessage` and mark your task
  completed."

## Create Team and Tasks

Create a team named `code-review-<branch-or-context>` with six tasks (seven if
`--plan` is active):

1. **Consistency Review** — naming patterns, code style consistency, error
   handling patterns, metric/label/logging consistency, structural consistency
   with existing codebase
1. **Idiomatic Go Review** — idiomatic Go as detailed in
   https://go.dev/doc/effective_go
1. **Data Consistency Review** — correctness of computations and state, race
   conditions in concurrent access, correct context/value propagation, resource
   lifecycle (leaks, double-close), appropriate data structure choices, error
   path completeness
1. **Security Review** — injection/cardinality attacks on labels or inputs,
   information leakage, unbounded reads or allocations, resource exhaustion,
   dependency security, timing side channels, authentication/authorization gaps
1. **Architecture Review** — separation of concerns, dependency direction (no
   circular or upward dependencies), interface design and abstraction
   boundaries, package cohesion and coupling, adherence to existing
   architectural patterns in the codebase, inappropriate layering violations,
   single-responsibility at the package and type level, extensibility without
   over-engineering
1. **Documentation Review** — if the change alters behavior, public APIs, or
   usage patterns, verify that the corresponding `docs/**/*.md` or
   `**/README.md` files have been updated; flag missing documentation updates
1. **Plan Adherence Review** *(only when `--plan` is active and a plan was
   located)* — see "Plan mode" above

## Spawn Agents in Parallel

Spawn one `general-purpose` agent per task (six, or seven with `--plan`). Each
agent prompt must include:

- The review dimension and what to focus on
- For the **Idiomatic Go Review** agent: instructions to MUST read
  https://go.dev/doc/effective_go for the full Effective Go guidelines before
  beginning the review
- The list of changed files
- **PR mode only:** `owner`, `repo`, `pullNumber`, the PR title, and the PR
  description — agents need these to call the GitHub MCP tools listed below

### PR mode agent instructions

Primary (GitHub MCP):

- Use `mcp__github__pull_request_read` with `method: "get_diff"`, `owner`,
  `repo`, `pullNumber` for the full diff
- Use `mcp__github__get_file_contents` with `owner`, `repo`, `path`, and
  `ref: "refs/heads/<head-branch>"` to read full file context

Fallback (`gh` CLI) — use if MCP calls fail:

- `gh pr diff <number> --repo <owner>/<repo>` for the full diff
- `gh api repos/<owner>/<repo>/contents/<path>?ref=<head-branch>` to read full
  file context

### Local mode agent instructions

- The diff is included directly in the agent prompt (unless the diff is too
  large — see "Large diffs" above)
- Use `Read`, `Glob`, `Grep` for file access when full context is needed beyond
  the diff

### All agents

- **DO NOT add comments to any PR. Send findings back to team-lead via
  SendMessage.**
- Mark their task as completed when done

## Collect Results

As each agent reports back via SendMessage, acknowledge receipt and send a
shutdown_request.

## Compile Summary

After all agents have reported, delete the team.

When `--plan` was active and findings were received, present the Plan Adherence
findings as a distinct subsection under "Informational / No Action Needed" (or
escalate items to "Actionable" only if the user clearly wants scope discipline
on this PR — default is informational):

```markdown
### Plan Adherence

**Plan:** `docs/plans/<slug>.md`

- **Unplanned files**: ...
- **Missing implementation**: ...
- **Scope excess**: ...
- **Plan drift**: ...
```

If no plan was located, state "Plan adherence: no plan located, skipped." once
in the summary — do not repeat per-dimension.

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

Present the consolidated review directly in the conversation using the same
format as PR mode output above, with these additional metadata fields at the
top:

```markdown
## Code Review: <branch-name or "uncommitted" or path>

**Date:** YYYY-MM-DD HH:MM
**Mode:** branch-diff | uncommitted | paths
**Branch:** <branch-name>
**Base:** <merge-base-ref> (if applicable)
**Files reviewed:** <count>

### Actionable Items
...

### Informational / No Action Needed
...
```

After presenting the review, ask the user what they want to do next:

```text
What would you like to do with this review?

1. Save to docs/plans/code-review-<date>.md
2. Address the actionable items now
3. Nothing — just wanted the review
4. Something else?
```

Deduplicate findings across agents — if multiple agents flag the same issue,
combine them into a single item citing all relevant perspectives.

## Notes

- The review is language-aware but optimized for Go codebases. The idiomatic Go
  agent uses the inlined Effective Go document at
  https://go.dev/doc/effective_go.
- For non-Go PRs, the idiomatic Go agent should be replaced with
  language-appropriate idiom checking, or omitted.
- All agents should read full file context (not just the diff) when needed to
  understand surrounding code patterns.
- The skill does not post any comments to the PR — all output stays in the
  conversation or in the local review file.

## References

- https://go.dev/doc/effective_go — Full Effective Go document used by the
  Idiomatic Go Review agent

## Prerequisites

### GitHub access (PR mode only)

Local mode needs no extra setup. PR mode needs one of the following (tried in
order):

#### Option 1: GitHub MCP server (preferred)

The skill uses `mcp__github__pull_request_read` and
`mcp__github__get_file_contents` from the
[GitHub MCP server](https://github.com/github/github-mcp-server).

Install it:

```bash
go install github.com/github/github-mcp-server/cmd/github-mcp-server@latest
```

Then add it to Claude Code with at least the `repos` and `pull_requests`
toolsets enabled and a
[GitHub personal access token](https://github.com/settings/tokens) with `repo`
scope:

```bash
claude mcp add github \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=ghp_... \
  -e GITHUB_TOOLSETS=context,repos,pull_requests \
  -- github-mcp-server stdio
```

**SAML SSO orgs:** If you get a 403 "Resource protected by organization SAML
enforcement" error, go to
[github.com/settings/tokens](https://github.com/settings/tokens), click
**Configure SSO** next to your token, and **Authorize** it for the org.
Alternatively the `gh` CLI fallback (below) will be used automatically.

#### Option 2: `gh` CLI (fallback)

If the GitHub MCP server is unavailable or returns errors, the skill falls back
to the [GitHub CLI](https://cli.github.com/) (`gh`). Authenticate with:

```bash
gh auth login
```

The `gh` CLI uses browser-based OAuth which inherits your SSO sessions, so it
works with SAML-enforced orgs out of the box.

### Claude Code agent teams (experimental)

The skill uses [agent teams](https://code.claude.com/docs/en/agent-teams)
(`TeamCreate`, `SendMessage`, `Task` with `team_name`) to run the review agents
in parallel. Enable the feature by adding the following to
`.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
