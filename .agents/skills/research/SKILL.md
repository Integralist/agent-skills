---
name: research
description: >-
  Research a topic, pattern, or codebase in depth and save a sourced reference
  document. Use when investigating a topic, exploring an external repository,
  or doing architecture research.
metadata:
  model-tier: complex
---

# Research

Produce a deep, cited reference document on a topic or repository, as the
foundation for later planning or implementation. If the request is too vague
to research, with no clear topic or repo, use the clarify skill first.

**Where it goes.** By default, write `docs/research/<yyyy-mm-dd>-<slug>.md`
with today's date. When the user or a coordinating skill names an active
`projects/<project>/` directory, write `projects/<project>/research.md`
instead. Ask when the scope is unclear, rather than creating a project
directory because research might help planning later. For project scope:

- Create `projects/README.md` from
  [PROJECTS-README.md](../shared/PROJECTS-README.md) and
  `projects/<project>/README.md` from
  [PROJECT-README.md](../shared/PROJECT-README.md) if either is missing.
- Add one `research.md` row to the project's artifact table, and keep the
  findings in `research.md` only.

**Mode.** A GitHub URL, `org/repo`, or bare repo name means code research;
a topic, concept, or question means topic research.

**Sources.** In both modes, search organizational knowledge sources as well
as code and the web, following
[KNOWLEDGE-SOURCES.md](../shared/KNOWLEDGE-SOURCES.md). Treat Confluence and
Google Drive as primary sources alongside code and docs, and Slack as
supporting context, not authority.

1. **Check for existing research** in the project's `research.md` and in
   `docs/research/`, matching on the slug and ignoring the date prefix:
   "CI pipeline caching" is covered by `*-ci.md` or
   `*-continuous-integration.md`, and `acme/widgets` by `*-widgets.md`. If a
   match fully answers the question, summarise it and stop; if it covers the
   topic in part, extend it rather than starting a second file. Done when
   you know whether you're extending a document or writing a new one.
2. **Research** in the mode that fits, below. Done when every question in
   scope has cited findings or is listed as unknown.
3. **Save** to the path above using the template, extending the existing
   document if step 1 found one, then summarise the research for the user
   and say where the full document is. Done when the document is written
   and, for project scope, indexed in the project README.

## Code research

1. **Locate the repo.** Take `{org}` and `{repo}` from the input: strip
   `https://github.com/` and any trailing `.git` from a URL, or split
   `org/repo` on `/`. With a known org, use `~/code/{org}/{repo}`, cloning it
   there with `gh repo clone {org}/{repo} ~/code/{org}/{repo}` if it's
   missing. For a bare name, search `~/code/*/{repo}`: use a single match,
   and ask the user to choose among several or for the org if there's none.
   Also ask when you're unsure what they want to know, the clone would land
   somewhere unexpected, or the clone fails. Done when you have a local
   path.
2. **Gather a metadata snapshot** with these commands:

   ```bash
   # Source revision, for citations
   git -C {repo_path} remote -v
   git -C {repo_path} rev-parse HEAD
   # Churn hotspots: most-changed files in the last year
   git -C {repo_path} log --format=format: --name-only --since="1 year ago" \
     | sort | uniq -c | sort -nr | head -20
   # Bus factor: all-time, then the last 6 months to spot absent contributors
   git -C {repo_path} shortlog -sn --no-merges
   git -C {repo_path} shortlog -sn --no-merges --since="6 months ago"
   # Bug clusters: files most touched by fix commits
   git -C {repo_path} log -i -E --grep="fix|bug|broken" --name-only --format='' \
     | sort | uniq -c | sort -nr | head -20
   # Commit velocity per month
   git -C {repo_path} log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c
   # Crisis patterns
   git -C {repo_path} log --oneline --since="1 year ago" \
     | grep -iE 'revert|hotfix|emergency|rollback'
   ```

   Flag files that appear in both the churn hotspots and the bug clusters
   as the highest-risk code. Done when the snapshot is captured.
3. **Spawn one read-only subagent** on the cheapest adequate tier,
   following [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md)
   and its completion and retry protocol. Give it the repo path, the user's
   goal, and the snapshot to decide what to read first. Tell it the work is
   read-only (no code changes, file writes, or state-changing commands), to
   use the session's relevant MCP servers (`gopls` for Go, `context7` for
   library docs), to search the knowledge sources above for design docs and
   discussions, and to note stale `docs/**/*.md` or `**/README.md` files.
   Done when it returns complete findings.

The saved document starts with a **Project Metadata** section holding the
snapshot and high-risk files, then follows the template.

## Topic research

Use every tool: read source, fetch docs through MCP, search the web and the
knowledge sources, and check sibling repositories in `../` for prior art.

**Investigators.** When a topic has substantial independent questions,
dispatch up to three read-only investigators under
[the shared policy](../shared/SUBAGENT-STEERABILITY.md), each with a
distinct question, scope, source paths or excerpts, and citation
requirements. They don't inherit your conversation, skills, credentials, or
MCP access, so verify what each can reach, fetch unavailable external
sources yourself and pass excerpts, and grant only read-only tools. Require
`COMPLETE` or `INCOMPLETE`, cited findings, conflicting evidence, unknowns,
and sources checked, with a 40-turn budget and the shared completion and
retry protocol. Reconcile and verify material claims yourself; you own the
synthesis and the document. Keep quick lookups inline, and if delegation
isn't available, say so and research inline.

## Template

````markdown
# {Topic}

## Overview

{What this is and why it matters, in one or two paragraphs.}

## Key Concepts

{Core abstractions, terminology, and mental models.}

## Architecture / How It Works

{Internal structure, data flow, component relationships, with Mermaid
diagrams for complex systems.}

## API Surface / Interface

{Public API, configuration options, CLI flags: whatever the consumer
touches.}

## Gotchas & Edge Cases

{Surprising behaviour, common mistakes, undocumented limits.}

## Trade-offs

{Design decisions, what was chosen, and what was given up.}

## References

{Links to source files, external docs, RFCs, issues.}
````

**Writing it.** Cite every factual claim inline: `path/to/file.go:42` for
code in the document's repository, a commit-pinned permalink for another
repository, and a URL for external docs, following
[conventions-markdown](../conventions-markdown/SKILL.md). Label an uncited
claim "unverified assumption" and say how to verify it. Draw diagrams
following [conventions-mermaid](../conventions-mermaid/SKILL.md). Cover
everything but omit needless words, following
[CONCISE-PROSE.md](../shared/CONCISE-PROSE.md): exhaustive means no fact
dropped, not more words per fact. Wrap Markdown at 80 columns.
