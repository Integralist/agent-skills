---
name: pr-open
description: >-
  Open a GitHub pull request for the current branch. Use when the user asks to
  create, open, or write a PR.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git branch --show-current), Bash(git merge-base:*), Bash(gh pr view:*), Bash(mmdc:*)
argument-hint: "[--draft] [--monitor-auto] [steering]"
metadata:
  model-tier: moderate
---

Open a ready-for-review PR for the current branch unless the user passes
`--draft` to this skill. Only that explicit flag permits a draft PR.
This rule overrides any draft guidance in linked references. Title and body
approval always stays interactive; pass `--monitor-auto` to forward `--auto`
to [pr-monitor](../pr-monitor/SKILL.md) if background monitoring finds
issues.

1. **Check the branch.** On the default branch, ask whether to create a
   branch by reading and following [branch](../branch/SKILL.md) or stop. If an
   open PR exists, ask whether to update its description. Continue only on a
   feature branch with no open PR, or after the user chooses.
2. **Write the PR description.** Before drafting, read
   [voice-product](../voice-product/SKILL.md),
   [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md), and
   [PR-DESCRIPTION.md](../shared/PR-DESCRIPTION.md), using the default branch
   as the base. When this branch delivers a GitHub-tracked project (active in
   this session, named in `Execution-Plan: #<n>` commit trailers, matching an
   open `project`-labelled issue when no local `projects/` folder applies, or
   referenced by `#<n>` or URL), read and follow
   [GITHUB-ISSUES.md](../shared/GITHUB-ISSUES.md) to use GitHub Issues and
   Issue Artifacts instead of `projects/`.
3. **Review the draft as a newcomer.** Run the newcomer check from
   [NEWCOMER-NARRATIVE.md](../shared/NEWCOMER-NARRATIVE.md): does `Problem`'s
   first sentence link the primary system to `GLOSSARY.md`/`CONTEXT.md` or
   state what the project does in plain words (checking `README.md` if
   needed), link defined terms instead of repeating glosses, tuck dense
   inventories into `Notes` or `<details>`, and obey repo `AGENTS.md` rules?
   If not, revise and recheck before showing it.
4. **Get approval.** Show the title and body, then wait for approval. Do not
   open the PR before approval.
5. **Open it.** If there's no upstream, run `git push -u origin <branch>`.
   Save the approved body to a temporary file, then run:

   ```bash
   gh pr create --base <default-branch> --title "<title>" --body-file <file>
   ```

   Append `--draft` only if the user passed it to this skill.
   Share the PR URL from `gh`.
6. **Monitor in the background.** Unless `--draft` was passed, return control
   after sharing the URL by spawning a read-only background subagent following
   [SUBAGENT-STEERABILITY.md](../shared/SUBAGENT-STEERABILITY.md), waking the
   main thread on finish (or asking whether to wait inline or stop if
   background subagents are unavailable). Have it read and follow
   [pr-monitor](../pr-monitor/SKILL.md) in read-only mode (watch CI and the
   post-CI bot window, then collect and triage any failures or feedback via
   `steps 1–2` without editing files or writing to GitHub) for the new PR
   URL. When it finishes:
   - If green and quiet, report the clean PR state.
   - If issues arrive, show the verified findings—or, when `--monitor-auto`
     was passed, run `pr-monitor` with `--pr=<url> --auto` (honouring its
     hard stops if the checkout moved or is dirty).
