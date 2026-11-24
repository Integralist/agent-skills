# PR title and description

Read every commit, the full diff against the PR's base, and enough surrounding
context (callers, config, tests, linked issues/specs) to explain why the
change exists and what changes in behaviour. Before drafting, read
[voice-product](../voice-product/SKILL.md) and
[CONCISE-PROSE.md](CONCISE-PROSE.md).

Derive behaviour from code and tests—treat commit messages and issues as
motivation, not proof. Separate implemented work from planned follow-ups.

## Title

Read [commit](../commit/SKILL.md) and use its subject style:
`type(scope): <why it matters>`. If the repo lints PR titles (`.github/workflows/`
or commitlint config), its rules win.

## Body

Use this template, even when the repo ships its own:

````md
## Problem

<What the project does in plain words, what's wrong or missing, who or what
it affects, and why it matters.>

## Solution

<Key change: what changed, where (real files/components), why, what stays the
same, and any trade-offs.>

## Notes

<Optional: pre-merge checks run and what they verify, migration steps, or
risks. Omit if empty.>

---

<details>
<summary>📋 <b>Project metadata</b></summary>

<Issue and ticket links as separate bullets (`Part of`, `Delivers`, `Closes`).>

</details>
````

## Rules

- **Newcomer context:** Assume a reader unfamiliar with the repository—open
  `Problem` by stating what the project does in plain words (check
  `README.md`, `GLOSSARY.md`, or `CONTEXT.md` if needed) and explain
  unfamiliar domain terms on first use (expanding an acronym alone is not
  enough). Name real components, files, or environments.
- **Verification, risks & evidence:** List only checks actually run and what
  they verify; leave post-merge steps (such as deploys) to the ticket. For
  material risks, name what is affected and whether reverting restores prior
  behaviour (flag irreversible effects like data deletion). Add concise
  before/after evidence (test output or screenshot) when it clarifies a
  behaviour change.
- **Project metadata:** Keep tracking links in the collapsed `Project metadata`
  block (no `open` attribute); omit the block and divider if empty. For
  For GitHub-tracked projects, before drafting or updating issue references,
  read and follow [task and PR reconciliation](GITHUB-ISSUES.md#task-and-pr-reconciliation).
  A slice reference alone is not a delivered-task inventory.
- **GitHub rendering:** Write each paragraph on one line (GitHub turns
  80-column hard wraps into jagged breaks). Use a blank line between list
  items; wrap Markdown snippets in four backticks; use status emoji sparingly
  (✅, ⚠️, ❌ — at most one per line, never in titles, headings, or code).
- **Diagrams:** Include a concise Mermaid diagram (`sequenceDiagram`,
  `flowchart`, or `stateDiagram-v2`, ~6–12 nodes with plain labels) whenever
  the change alters how parts call each other, branch, or move through states;
  omit it only when no useful flow exists. Check diagrams with
  [conventions-mermaid](../conventions-mermaid/SKILL.md). If a changed
  caller/package map materially aids review, consult
  [code-graph](../code-graph/SKILL.md) and embed Mermaid (no PNG export).
