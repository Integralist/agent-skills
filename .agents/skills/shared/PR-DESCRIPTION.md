# PR title and description

How to write a pull request's title and description. Read and follow the
[voice-product](../voice-product/SKILL.md) skill before drafting, after reading
every commit, the full diff against the PR's base, and enough surrounding
context (callers, config, tests, and linked issues, specs, or decisions) to
explain why the change exists and what changes in behaviour.

Derive implemented behaviour from code and tests; treat commit messages and
issue text as motivation, not proof. Separate implemented work from planned
follow-ups.

## Title

Write it as the [commit](../commit/SKILL.md) skill writes a subject:
`type(scope): <why it matters>`. If the repo lints PR titles (a workflow in
`.github/workflows/` or a commitlint config), its rules win.

## Body

Use this template, even when the repo ships its own:

````md
## Problem

<What's wrong or missing, who or what it affects, and why it matters. State
system role and prerequisite terms if crossing boundaries. Reference the
issue or ticket as separate bullet items if there is one (for example,
`- Part of #<root> — <title>` and `- Delivers #<slice> — <title>`, or
`- Closes #<issue>`).>

## Solution

<Lead with the key change: who changes what, where, and why, naming real
components, files, or environments. Separate setup from runtime behaviour,
state what stays the same, and note trade-offs beside benefits.>

```mermaid
<High-level diagram when flow, branching, or state changes.>
```

## Notes

<Optional: pre-merge checks—what tests were run and what they verify,
migration steps, risks. Omit if empty.>
````

### Rules

- Describe behaviour and intent, not a file-by-file inventory. The reviewer
  gets line detail from the diff.
- For GitHub-tracked projects, before drafting or updating issue references,
  read and follow [task and PR reconciliation](GITHUB-ISSUES.md#task-and-pr-reconciliation).
  A slice reference alone is not a delivered-task inventory.
- In `Problem`, briefly introduce the system's role and avoid unexplained
  jargon or acronyms: explain necessary terms on first use in plain words
  (expanding an acronym is not enough), even when a term looks familiar.
- In `Solution`, name concrete components, files, or environments rather than
  vague abstractions, and say what stays unchanged in refactors.
- Keep `Notes` strictly to what a reviewer can check before merging. Leave
  post-merge work, such as deploys, to the ticket. List only testing you or
  the user actually ran, stating what it exercises and verifies.
- Include concise before/after evidence when it clarifies a behavior change:
  a regression test, screenshot for a visual change, or observed output.
- For material risks, name affected users, systems, or data, and say whether
  reverting the code restores prior behavior; call out effects a revert
  cannot undo, such as deleted data.
- Write each paragraph as one line. GitHub soft-wraps, so breaks at 80 columns
  render ragged.
- Separate bullet items with a blank line so GitHub spaces them out.
- Use an emoji only where it signals status faster than words (✅ verified, ⚠️
  caution, ❌ breaking), at most one per line, and never in the title, headings,
  or code.
- Wrap a Markdown code block in 4 backticks so inner 3-backtick blocks don't
  break it.

### Diagram

Include a high-level Mermaid diagram whenever the change alters how parts
call each other, branch, or move through states. Omit it only when no useful
flow exists:

- `sequenceDiagram` for calls between parts
- `flowchart` for branching
- `stateDiagram-v2` for lifecycles

Keep it high-level: plain role labels, only the slice that changed, a dozen
nodes or fewer (prefer six or fewer when clear), setup separated from runtime
when helpful, an error or rejection path when useful, and ` (new)` or
` (changed)` on the steps the diff touches. Check it with the
[conventions-mermaid](../conventions-mermaid/SKILL.md) skill.

**Optional code map.** Add a second diagram only if it reveals a changed
caller, dependency, or package boundary that matters to the review and isn't
clear from the first diagram. Read [code-graph](../code-graph/SKILL.md) and
use its tracing, change-mapping, and validation guidance with the same base
and head as the PR diff.

Under `Solution`, follow the first diagram with a short paragraph explaining
what the map adds and what it helps reviewers check. Then include the map in
a `mermaid` block. Do not export a PNG.
