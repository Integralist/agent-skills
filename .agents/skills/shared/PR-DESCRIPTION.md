# PR title and description

Read every commit, the full diff against the PR's base, and surrounding context
(callers, config, tests, linked issues/specs) to explain why the change exists
and what changes in behaviour. Before drafting, read
[voice-product](../voice-product/SKILL.md),
[CONCISE-PROSE.md](CONCISE-PROSE.md), and
[NEWCOMER-NARRATIVE.md](NEWCOMER-NARRATIVE.md).

Derive behaviour from code and tests—treat commit messages and issues as
motivation, not proof. Separate implemented work from planned follow-ups.

## Title

Read [commit](../commit/SKILL.md) and use its subject style:
`type(scope): <why it matters>`. If the repo lints PR titles
(`.github/workflows/` or commitlint config), its rules win.

## Body

Use this template even when the repo ships its own PR template, while honoring
stricter target-repo `AGENTS.md` rules (such as one-way-door declarations):

````md
## Problem

<1–2 short, blank-line-separated paragraphs: open with <System name> (<what
the project does in plain words>) and a concrete user or system example; then
show what is missing or wrong, who it affects, and why it matters.>

## Solution

<1–2 short, blank-line-separated paragraphs (or up to 5 short bullets): continue
the example (who changes what, where, and why), state what stays the same and
any limits, and keep prose ~150 words—not a file catalogue.>

```mermaid
<One ~6–12-node diagram when flow, branching, or state changes; omit if none.>
```

## Notes

<Optional: 1–3 bullets for checks run and what they verify, concise
before/after evidence, material risks, or open gates. Omit if empty.>

---

<details>
<summary>⚙️ <b>Technical details</b></summary>

<Optional: dense file or endpoint inventories, verification logs, or repo
merge-gate checklists (such as one-way-door declarations). Omit if empty.>

</details>

<details>
<summary>📋 <b>Project metadata</b></summary>

<Issue and ticket links as separate bullets (`Part of`, `Delivers`, `Closes`).
Omit if empty.>

</details>
````

## Rules

- **Narrative & diagram:** Follow
  [NEWCOMER-NARRATIVE.md](NEWCOMER-NARRATIVE.md) across `Problem` and
  `Solution`—opening `Problem` by
  stating what the project does in plain words—and embed the diagram (~6–12
  nodes) in a fenced `mermaid` block. Consult
  [code-graph](../code-graph/SKILL.md) if a caller/package map materially aids
  review (embed Mermaid, no PNG export).
- **Details, checks & risks:** Keep `Notes` to 1–3 short bullets with one
  fact per bullet—omit cleared gates, `None` blockers, and duplicate evidence
  links (keep links in `Project metadata`). List only checks run and what they
  verify (leave deploys to the ticket), concise before/after evidence, material
  risks with revert impact, and required `AGENTS.md` gates. Tuck dense
  inventories and checklists into collapsed `<details>` below `---` (no `open`
  attribute); omit empty blocks and the divider.
- **Project metadata:** Keep tracking links in `Project metadata`. For
  GitHub-tracked projects, before drafting or updating issue references,
  read and follow [task and PR reconciliation](GITHUB-ISSUES.md#task-and-pr-reconciliation).
  A slice reference alone is not a delivered-task inventory.
- **GitHub rendering:** Write each individual paragraph on one line (GitHub
  turns 80-column wraps into breaks) and separate paragraphs with a blank line.
  Use a blank line between list items and inside
  `<details>`; wrap Markdown snippets in four backticks; use status emoji
  sparingly (✅, ⚠️, ❌ — at most one per line, never in titles, headings, or
  code) to help key details stand out.
