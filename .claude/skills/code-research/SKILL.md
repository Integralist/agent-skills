---
name: code-research
description: >-
  Triggers when user mentions a repo by name or GitHub URL — e.g.
  "check the spotless repo", "look at the
  github.com/fastly/spotless repo". Locates the repo locally under
  ~/code or clones it with gh.
user-invocable: true
argument-hint: <repo-name | github-url>
---

# Code Research

Look at, explore, or research a repository by name or GitHub URL.

## When to use

- User asks to look at, explore, or research a repo.
- Input is a GitHub URL (`https://github.com/{org}/{repo}`) or a
  bare repo name (optionally with org prefix like `org/repo`).

## Parse input

Extract `{org}` and `{repo}` from the argument:

1. **GitHub URL** — strip `https://github.com/` prefix, split on `/`
   to get `{org}` and `{repo}`. Remove any trailing `.git`.
1. **`org/repo` form** — split on `/`.
1. **Bare repo name** — no `/` present; `{org}` is unknown.

## Locate locally

1. If `{org}` is known, check whether `~/code/{org}/{repo}` exists.
1. If only a bare name, search `~/code/*/{repo}` for a matching
   directory.
   - If exactly one match is found, use it.
   - If multiple matches are found, list them and ask the user which
     one to use.
   - If no match is found, ask the user for the org (or full URL) so
     you can clone it.

## Clone if missing

If the repo is not found locally and `{org}` is known:

```bash
gh repo clone {org}/{repo} ~/code/{org}/{repo}
```

## Gather project metadata

Before spawning the research agent, run the following git commands
inside the repo directory to build a diagnostic snapshot. Capture the
output of each command and include it in the agent prompt as context.

### Churn hotspots — most-changed files in the last year

```bash
git -C {repo_path} log --format=format: --name-only --since="1 year ago" \
  | sort | uniq -c | sort -nr | head -20
```

### Bus factor — contributors ranked by commit count

```bash
git -C {repo_path} shortlog -sn --no-merges
```

Also check for recent activity (last 6 months) to flag absent top
contributors:

```bash
git -C {repo_path} shortlog -sn --no-merges --since="6 months ago"
```

### Bug clusters — files most often touched in bug-fix commits

```bash
git -C {repo_path} log -i -E --grep="fix|bug|broken" \
  --name-only --format='' | sort | uniq -c | sort -nr | head -20
```

### Commit velocity — commits per month

```bash
git -C {repo_path} log --format='%ad' --date=format:'%Y-%m' \
  | sort | uniq -c
```

### Crisis patterns — reverts, hotfixes, and rollbacks

```bash
git -C {repo_path} log --oneline --since="1 year ago" \
  | grep -iE 'revert|hotfix|emergency|rollback'
```

### Cross-reference

Files that appear in **both** the churn hotspots and the bug clusters
lists are the highest-risk code. Flag these explicitly in the metadata
passed to the agent.

## When in doubt, ask

Do not guess. If any of the following are unclear, stop and ask the
user before proceeding:

- The input is ambiguous (e.g. a bare name that could match multiple
  orgs, or a name that doesn't match any known repo).
- You aren't sure what the user wants to know about the repo.
- The clone would go to an unexpected location.
- The repo doesn't exist on GitHub (clone fails).

Prefer a short clarifying question over a wrong assumption.

## Create Team and Task

Create a team named `code-research-{repo}` with one task:

1. **Research** — explore the repo and answer the user's question

## Spawn Agent

Spawn a single `general-purpose` agent named `code-researcher` on
the team, assigned to the **Research** task. The agent prompt must
include:

- The repo path (`~/code/{org}/{repo}`)
- The user's question or research goal
- The **project metadata** gathered above (churn hotspots, bus
  factor, bug clusters, commit velocity, crisis patterns, and
  cross-referenced high-risk files) — instruct the agent to use
  this metadata to prioritize which code to read first
- Instructions to use `Read`, `Glob`, `Grep`, and Explore patterns
  to investigate the codebase
- Instructions to use any relevant MCP servers available in the
  session (e.g. `gopls` for Go projects — `go_search`,
  `go_file_context`, `go_package_api`; `context7` for library
  documentation lookups)
- Instructions to save findings to `docs/research/{repo}.md`
- Instructions to note any stale `docs/**/*.md` or
  `**/README.md` files discovered during research
- **Send findings back to team-lead via `SendMessage` and mark the
  task as completed when done**

## Main Agent Continues

While `@code-researcher` runs, the main agent remains available
(can answer other questions, do lightweight lookups, etc.).

## Collect Results

When `@code-researcher` reports back via `SendMessage`, acknowledge
receipt and send a `shutdown_request`. Then delete the team.

## Save Findings

Write a research document to `docs/research/{repo}.md` containing
the full findings. The document must include a **Project Metadata**
section at the top with the git diagnostic snapshot (churn hotspots,
bus factor, bug clusters, commit velocity, crisis patterns, and
high-risk files). If the file already exists, overwrite it with the
latest research.

## Present Findings

Summarize the research to the user and note where the full document
was saved.

## Prerequisites

### Claude Code agent teams (experimental)

The skill uses
[agent teams](https://code.claude.com/docs/en/agent-teams)
(`TeamCreate`, `SendMessage`, `Task` with `team_name`) to run the
research agent in parallel. Enable the feature by adding the
following to `.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
