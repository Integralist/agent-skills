---
name: draft-pr
description: Draft a concise, direct pull request with a clear Problem and Solution. Use when the user asks to create, draft, or open a PR.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(git merge-base:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh pr view:*), Bash(gh repo view:*)
---

# Draft PR

Open a pull request whose description is direct and concise, structured
around a clear **Problem** and **Solution**.

## Context

If the fields below show commands rather than output, run each one first.

- Branch: !`git branch --show-current 2>/dev/null || echo "(not a git repo)"`
- Base: !`git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p' || echo main`
- Status: !`git status --short 2>/dev/null`
- Branch commits: !`git log --oneline $(git merge-base HEAD $(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p' || echo main) 2>/dev/null)..HEAD 2>/dev/null`
- Branch vs base diffstat: !`git diff --stat $(git merge-base HEAD $(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p' || echo main) 2>/dev/null)...HEAD 2>/dev/null`
- Existing PR: !`gh pr view --json url,state,isDraft 2>/dev/null || echo "(none)"`

## Process

1. **Check preconditions.**

   - Not a git repo, or branch is the base branch itself → stop and say
     so. A PR needs a feature branch distinct from base.
   - If an open PR already exists for this branch, stop and ask whether to
     update its description instead of opening a new one.

1. **Read the full branch diff** —
   `git diff $(git merge-base HEAD <base>)...HEAD`. Don't rely on the
   diffstat; the Problem/Solution must reflect actual hunks. Read commit
   messages for intent the diff alone doesn't reveal.

1. **Confirm the base branch** if ambiguous (e.g. no `origin` HEAD, or the
   branch was cut from something other than main). Otherwise use the
   detected base.

1. **Write the description** using the Template below.

   - **Problem:** what was wrong or missing, and why it matters. State the
     observable symptom or gap, not the implementation. If the branch
     links to an issue/ticket, reference it here.
   - **Solution:** what the change does to fix the Problem, at a level a
     reviewer can verify against the diff. Lead with the key change;
     mention notable trade-offs or alternatives rejected.
   - Keep both tight. One short paragraph or a few bullets each. Cut
     filler ("this PR", "simply", "just"). Active voice.
   - Add `## Notes` only if there's testing done, a migration step, a
     risk, or a follow-up worth flagging. Omit it otherwise.

1. **Derive the title** from the change: imperative mood, concise, no
   trailing period. Follow `~/.gitcommit` conventions (type prefix/scope)
   if that file exists.

1. **Show the title and description to the user and wait for approval.**
   Do not open the PR before then.

1. **Push if needed,** then open the PR:

   - `git push -u origin <branch>` if the branch has no upstream.
   - `gh pr create --base <base> --title <title> --body-file -` piping the
     approved body via heredoc.
   - Open ready-for-review by default. Add `--draft` only if the user
     asked for a draft.

1. **Report the PR URL** from `gh`'s output.

## Template

```md
## Problem

<What's wrong or missing, and why it matters. Reference the issue/ticket
if there is one.>

## Solution

<What the change does to fix it, verifiable against the diff. Lead with
the key change; note trade-offs.>

## Notes

<Optional: testing, migration steps, risks, follow-ups. Omit if empty.>
```

## Style

- Direct and concise. No marketing tone, no restating the diff line by
  line, no boilerplate checklists.
- Use backticks for identifiers, paths, flags, env vars.
- Describe behaviour and intent, not a file-by-file walkthrough.
- Don't invent testing or context that isn't in the diff or supplied by
  the user — ask instead.
- Match any PR template the repo ships (`.github/PULL_REQUEST_TEMPLATE*`)
  if present, mapping Problem/Solution onto its sections.
