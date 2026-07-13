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
Output goes to `docs/research/<yyyy-mm-dd>-<slug>.md` (date prefix
from today's date) and serves as the foundation for later
planning or implementation work.

If the request is too vague to research (no clear topic or repo), elicit intent
first via [`task`](../task/SKILL.md).

## Detect research mode

| Input                                 | Mode               |
| ------------------------------------- | ------------------ |
| GitHub URL (`https://github.com/o/r`) | **Code research**  |
| `org/repo` or bare repo name          | **Code research**  |
| Topic, concept, or question           | **Topic research** |

## Check for existing research

Before starting either mode, scan `docs/research/` for documents
that already cover the topic or repo. Match on the slug portion;
ignore the `yyyy-mm-dd-` date prefix — "CI pipeline caching" is
covered by an existing `*-ci.md` or `*-continuous-integration.md`;
the `fastly/spotless` repo is covered by `*-spotless.md`.

- **Exact or near match**: read it. If it covers what the user
  needs, summarize and stop. If it covers the topic partially,
  extend it (add/deepen sections) rather than creating a second
  file.
- **No match**: proceed with the mode below.

## Search organizational knowledge sources

Beyond code and the web, search organizational knowledge sources
in **both** modes — see
[`../shared/KNOWLEDGE-SOURCES.md`](../shared/KNOWLEDGE-SOURCES.md)
for the source catalog and the fallback rule when a source is
unavailable.

For research specifically, weight them as follows:

- **Confluence** and **Google Drive** — primary sources alongside
  code and web docs.
- **Slack** — supporting context, not authoritative
  documentation.

## Mode A: Code research (repo by name or URL)

### Parse input

Extract `{org}` and `{repo}` from the argument:

1. **GitHub URL** — strip `https://github.com/`, split on `/`,
   remove any trailing `.git`.
1. **`org/repo`** — split on `/`.
1. **Bare repo name** — no `/`; `{org}` is unknown.

### Locate locally

1. If `{org}` is known, check `~/code/{org}/{repo}`.
1. If only a bare name, search `~/code/*/{repo}`:
   - One match: use it.
   - Multiple: list them and ask which to use.
   - None: ask the user for the org (or full URL) to clone.

### Clone if missing

If not found locally and `{org}` is known:

```bash
gh repo clone {org}/{repo} ~/code/{org}/{repo}
```

### Gather project metadata

Run these git commands inside the repo to build a diagnostic
snapshot. Capture the output and include it in the subagent
prompt as context.

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

Recent activity (last 6 months) to flag absent top contributors:

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

**Cross-reference**: files in **both** churn hotspots and bug
clusters are the highest-risk code. Flag these explicitly in the
metadata passed to the subagent.

### When in doubt, ask

Don't guess. Stop and ask the user if:

- The input is ambiguous (e.g. a bare name matching multiple orgs).
- You aren't sure what the user wants to know about the repo.
- The clone would go to an unexpected location.
- The repo doesn't exist on GitHub (clone fails).

### Spawn a subagent for code research

Spawn a single general-purpose subagent on the cheapest model tier
adequate to the research (see
[`../shared/SUBAGENT-STEERABILITY.md`](../shared/SUBAGENT-STEERABILITY.md)).
The prompt must include:

- The repo path (`~/code/{org}/{repo}`).
- A statement that this is **read-only research**: investigate and
  report only; do not modify code, write files, or run
  state-changing commands.
- The user's question or research goal.
- The **project metadata** above — instruct the subagent to use it
  to prioritize which code to read first.
- Instructions to use file reading, search, and exploration to
  investigate the codebase.
- Instructions to use relevant MCP servers available in the
  session (e.g. `gopls` for Go — `go_search`, `go_file_context`,
  `go_package_api`; `context7` for library docs).
- Instructions to search organizational knowledge sources
  (Confluence/Drive for design docs, Slack for discussions about
  the repo) — see "Search organizational knowledge sources".
- Instructions to note any stale `docs/**/*.md` or `**/README.md`
  files discovered during research.

### Save findings

Write to `docs/research/<yyyy-mm-dd>-{repo}.md` (date prefix from
today), or extend the existing document found earlier. The
document must include a **Project Metadata** section at the top
with the git diagnostic snapshot (churn hotspots, bus factor, bug
clusters, commit velocity, crisis patterns, high-risk files). Use
the Mode B template below.

Then summarize the research to the user and note where the full
document was saved.

## Mode B: Topic research

Use for concepts, technologies, patterns — anything that isn't a
specific repo.

### Conduct research

Study the topic deeply. Use every tool: read source code, explore
the codebase, fetch docs via MCP, search the web, and check
sibling repositories in the parent directory (`../`) for reference
implementations or prior art. Also search organizational knowledge
sources — Confluence, Google Drive, and Slack — per "Search
organizational knowledge sources" above.

### Output

Write to `docs/research/<yyyy-mm-dd>-<topic-slug>.md` (date prefix
from today), or extend the existing document found earlier. Use
this template:

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

- Cite every factual claim inline — `path/to/file.go:42` for code,
  URL for external docs. Claims you cannot cite must be labelled
  "unverified assumption" and include how to verify them.
- Use specific file paths and line numbers when referencing code.
- Be exhaustive in coverage but concise in prose — omit needless
  words, see [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
  Exhaustive means no fact dropped, not more words per fact.
- Wrap all Markdown output at 80 columns.
