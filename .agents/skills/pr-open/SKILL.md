---
name: pr-open
description: >-
  Open a GitHub pull request for the current branch. Use when the user asks to
  create, open, or write a PR.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git branch:*), Bash(git merge-base:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh pr edit:*), Bash(mmdc:*)
metadata:
  model-tier: moderate
---

Open a ready-for-review PR for the current branch unless the user passes
`--draft` to this skill. Only that explicit flag permits a draft PR.
This rule overrides any draft guidance in linked references.

1. **Check the branch.** On the default branch, ask whether to create a
   branch by reading and following [branch](../branch/SKILL.md) or stop. If an
   open PR exists, ask whether to update its description. Continue only on a
   feature branch with no open PR, or after the user chooses.
2. **Write the PR description.** Before drafting, read
   [voice-product](../voice-product/SKILL.md),
   [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md), and
   [PR-DESCRIPTION.md](../shared/PR-DESCRIPTION.md), using the default branch
   as the base. For `--github` or an issue reference (`#<n>` or URL), read and
   follow [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues
   and Issue Artifacts instead of `projects/`.
3. **Review the draft as a newcomer.** Read `Problem` without relying on repo
   memory: does its first sentence state what the project does in plain words
   (checking `README.md`, `GLOSSARY.md`, or `CONTEXT.md` if needed), explain
   technical terms on first use, and show why the change matters? If not,
   revise the draft and check it again before showing it.
4. **Get approval.** Show the title and body, then wait for approval. Do not
   open the PR before approval.
5. **Open it.** If there's no upstream, run `git push -u origin <branch>`.
   Save the approved body to a temporary file, then run:

   ```bash
   gh pr create --base <default-branch> --title "<title>" --body-file <file>
   ```

   Append `--draft` only if the user passed it to this skill.
   Share the PR URL from `gh`.
