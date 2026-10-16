---
name: open-pr
description: >-
  Open a GitHub pull request for the current branch. Use when the user asks to
  create, open, or write a PR.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git branch:*), Bash(git merge-base:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr edit:*), Bash(mmdc:*)
metadata:
  model-tier: moderate
---

# Open PR

Open a ready-for-review pull request for the current branch, with a title that
says what the change is worth and a short Problem / Solution description. Write
the title and body with the product-voice skill.

1. **Check the branch.** On the default branch, ask whether to create a branch
   with the branch skill or stop. If this branch already has an open PR, ask
   whether to update its description instead. Done when you're on a feature
   branch with no open PR, or the user has chosen.

2. **Read the change.** Read every commit and the full diff since the branch
   left the default branch (`git merge-base`), not just the list of changed
   files. Done when you can say what the change fixes and how.

3. **Write the title** as the commit skill writes a subject:
   `type(scope): <why it matters>`. If the repo lints PR titles (a workflow in
   `.github/workflows/` or a commitlint config), its rules win.

4. **Write the body** from this template, even when the repo ships its own:

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

   - Describe behaviour and intent. The reviewer gets file-by-file detail from
     the diff.
   - Notes holds only what a reviewer can check before merging. Leave
     post-merge work, such as deploys, to the ticket. List only testing that
     you or the user actually did.
   - Write each paragraph as one line. GitHub soft-wraps, so breaks at 80
     columns render ragged.
   - Separate bullet items with a blank line so GitHub spaces them out.
   - Use an emoji only where it signals status faster than words (✅ verified,
     ⚠️ caution, ❌ breaking), at most one per line, and never in the title,
     headings, or code.
   - Wrap a Markdown code block in 4 backticks so inner 3-backtick blocks
     don't break it.

5. **Add a diagram when it helps.** When the change alters how parts call each
   other, branch, or move through states, add one Mermaid diagram of the type
   that fits: `sequenceDiagram` for calls between parts, `flowchart` for
   branching, `stateDiagram-v2` for lifecycles. Keep it high-level: only the
   slice that changed, a dozen nodes or fewer, with ` (new)` or ` (changed)` on
   the steps the diff touches. Check it with the conventions-mermaid skill.

6. **Get approval.** Show the title and body, then wait for the user to
   approve. Done when they approve.

7. **Open it.** If the branch has no upstream, run `git push -u origin
   <branch>`. Write the body to a temp file, then run
   `gh pr create --base <default-branch> --title "<title>" --body-file <file>`.
   Done when `gh` prints the PR URL and you've shared it.
