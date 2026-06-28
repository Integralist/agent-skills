---
name: research
description: >-
  Research a topic or repository deeply and produce a reference
  document under `docs/research/`. Handles two modes: code
  research (repo by URL, `org/repo`, or bare name — e.g. "check
  the spotless repo", "look at github.com/fastly/spotless") and
  topic research (concepts, technologies, patterns). Use when
  the user wants to research something, explore a repo, or says
  /research.
---

# Research

Produce a deep reference document for a topic or repository.
Output goes to `docs/research/<yyyy-mm-dd>-<slug>.md` (date
prefix from today's date) and serves as the foundation for
later planning or implementation work.

## Detect research mode

Determine which mode to use based on the user's input:

| Input                                 | Mode               |
| ------------------------------------- | ------------------ |
| GitHub URL (`https://github.com/o/r`) | **Code research**  |
| `org/repo` or bare repo name          | **Code research**  |
| Topic, concept, or question           | **Topic research** |

## Check for existing research

Before starting new research in either mode, scan
`docs/research/` for documents that already cover the topic or
repo. Filenames carry a `yyyy-mm-dd-` date prefix, so match on
the slug portion and ignore the date — a request about "CI
pipeline caching" is covered by an existing `*-ci.md` or
`*-continuous-integration.md`; a request about the
`fastly/spotless` repo is covered by `*-spotless.md`.

- **Exact or near match found**: Read the document. If it
  already covers what the user needs, summarize and stop. If it
  covers the topic partially, extend it — add new sections or
  deepen existing ones rather than creating a second file.
- **No match found**: Proceed with the appropriate research
  mode below.

## Mode A: Code research (repo by name or URL)

Use this mode when the user references a specific repository.

### Parse input

Extract `{org}` and `{repo}` from the argument:

1. **GitHub URL** — strip `https://github.com/` prefix, split
   on `/` to get `{org}` and `{repo}`. Remove any trailing
   `.git`.
1. **`org/repo` form** — split on `/`.
1. **Bare repo name** — no `/` present; `{org}` is unknown.

### Locate locally

1. If `{org}` is known, check whether `~/code/{org}/{repo}`
   exists.
1. If only a bare name, search `~/code/*/{repo}` for a matching
   directory.
   - If exactly one match is found, use it.
   - If multiple matches are found, list them and ask the user
     which one to use.
   - If no match is found, ask the user for the org (or full
     URL) so you can clone it.

### Clone if missing

If the repo is not found locally and `{org}` is known:

```bash
gh repo clone {org}/{repo} ~/code/{org}/{repo}
```

### Gather project metadata

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
hotspots and bug clusters are the highest-risk code. Flag these
explicitly in the metadata passed to the subagent.

### When in doubt, ask

Do not guess. If any of the following are unclear, stop and ask
the user before proceeding:

- The input is ambiguous (e.g. a bare name that could match
  multiple orgs).
- You aren't sure what the user wants to know about the repo.
- The clone would go to an unexpected location.
- The repo doesn't exist on GitHub (clone fails).

Prefer a short clarifying question over a wrong assumption.

### Spawn a subagent for code research

Spawn a single general-purpose subagent. The prompt must
include:

- The repo path (`~/code/{org}/{repo}`)
- A statement that this is **read-only research**: investigate and
  report findings only; do not modify code, write files, or run
  state-changing commands
- The user's question or research goal
- The **project metadata** gathered above — instruct the
  subagent to use this metadata to prioritize which code to
  read first
- Instructions to use file reading, search, and exploration
  patterns to investigate the codebase
- Instructions to use any relevant MCP servers available in the
  session (e.g. `gopls` for Go projects — `go_search`,
  `go_file_context`, `go_package_api`; `context7` for library
  documentation lookups)
- Instructions to note any stale `docs/**/*.md` or
  `**/README.md` files discovered during research

### Save findings

Write findings to `docs/research/<yyyy-mm-dd>-{repo}.md` (new
file, date prefix from today's date) or extend the existing
document identified during the "Check for existing research"
step. The document must include a **Project
Metadata** section at the top with the git diagnostic snapshot
(churn hotspots, bus factor, bug clusters, commit velocity,
crisis patterns, and high-risk files).

Use the same research template shown in Mode B below.

### Present findings

Summarize the research to the user and note where the full
document was saved.

## Mode B: Topic research

Use this mode for concepts, technologies, patterns, or anything
that isn't a specific repo.

### Conduct research

Take the user's topic and study it deeply. Use every tool at
your disposal: read source code, explore the codebase, fetch
documentation via MCP, search the web, and check sibling
repositories in the parent directory (`../`) for relevant
reference implementations or prior art.

### Output

Write to `docs/research/<yyyy-mm-dd>-<topic-slug>.md` (new
file, date prefix from today's date) or extend the existing
document identified above.

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

## Guidelines

- Every factual claim in a research document must be cited
  inline — `path/to/file.go:42` for code, URL for external
  docs. Claims you cannot cite must be labelled "unverified
  assumption" and include how to verify them.
- Use specific file paths and line numbers when referencing
  code.
- Research documents should be exhaustive.
- Wrap all Markdown output at 80 columns.
