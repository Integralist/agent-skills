# PR title and description

How to write a pull request's title and description. Write both with the
product-voice skill, after reading every commit and the full diff against the
PR's base, not just the list of changed files.

**Title.** Write it as the commit skill writes a subject:
`type(scope): <why it matters>`. If the repo lints PR titles (a workflow in
`.github/workflows/` or a commitlint config), its rules win.

**Body.** Use this template, even when the repo ships its own:

````md
## Problem

<What's wrong or missing, and why it matters. Reference the issue or ticket
if there is one.>

## Solution

<What the change does to fix it, verifiable against the diff. Lead with the
key change; note trade-offs.>

<Optional: one high-level Mermaid diagram.>

## Notes

<Optional: testing done, migration steps, risks. Omit if empty.>
````

- Describe behaviour and intent. The reviewer gets file-by-file detail from the
  diff.
- Notes holds only what a reviewer can check before merging. Leave post-merge
  work, such as deploys, to the ticket. List only testing that you or the user
  actually did.
- Write each paragraph as one line. GitHub soft-wraps, so breaks at 80 columns
  render ragged.
- Separate bullet items with a blank line so GitHub spaces them out.
- Use an emoji only where it signals status faster than words (✅ verified, ⚠️
  caution, ❌ breaking), at most one per line, and never in the title, headings,
  or code.
- Wrap a Markdown code block in 4 backticks so inner 3-backtick blocks don't
  break it.

**Diagram.** When the change alters how parts call each other, branch, or move
through states, add one Mermaid diagram of the type that fits:
`sequenceDiagram` for calls between parts, `flowchart` for branching,
`stateDiagram-v2` for lifecycles. Keep it high-level: only the slice that
changed, a dozen nodes or fewer, with ` (new)` or ` (changed)` on the steps the
diff touches. Check it with the conventions-mermaid skill.
