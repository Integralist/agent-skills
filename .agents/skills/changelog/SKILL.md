---
name: changelog
description: Add a new entry to the project's CHANGELOG.md based on uncommitted diff or branch-vs-main changes. Use when the user asks to update the changelog, add a changelog entry, or record changes.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git rev-parse:*), Bash(git merge-base:*), Bash(git branch:*), Bash(date:*), Read, Edit, Write
---

# Changelog

Generate a [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)
entry in the project's `CHANGELOG.md`.

## Context

- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Working diffstat: !`git diff --stat HEAD 2>/dev/null`
- Branch vs main diffstat: !`git diff --stat $(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null)...HEAD 2>/dev/null`
- Branch commits: !`git log --oneline $(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null)..HEAD 2>/dev/null`
- Today: !`date +%Y-%m-%d`

## Process

1. **Pick the change source.**

   - If working tree has uncommitted changes (staged or unstaged), use
     `git diff HEAD` as the source of truth.
   - Otherwise, diff the branch against `main` (or `master` if main is
     absent): `git diff $(git merge-base HEAD <base>)...HEAD`. Also read
     `git log` on the branch for commit-message hints.
   - If both are empty, stop and tell the user there's nothing to record.

1. **Read the full diff** of the chosen source. Don't rely on diffstat
   alone — categorisation needs the actual hunks.

1. **Locate `CHANGELOG.md`** at the repo root.

   - If absent, **create it** using the Template below before adding the
     new entry. Start the version history at `0.0.1` unless the user
     specifies otherwise, or unless tags / `package.json` / `Cargo.toml`
     / similar suggest a different starting version.
   - If present, read it to match existing style (heading depth, version
     scheme, sub-section headings like `#### \`pkg\`` groupings, en-dash
     vs hyphen in date).

1. **Determine the version.**

   - Look at the most recent version heading and increment per SemVer:
     - `Fixed`-only → patch bump
     - `Added` / `Changed` (non-breaking) → minor bump
     - Breaking `Changed` / `Removed` → major bump
   - If the project is pre-1.0 (`0.x.y`), bump the patch for everything
     unless the user says otherwise.
   - If unsure, ask the user with `AskUserQuestion`.

1. **Categorise changes** under Keep a Changelog sections, in this order,
   omitting empty ones:

   - `Added` — new features
   - `Changed` — changes to existing functionality
   - `Deprecated` — soon-to-be-removed features
   - `Removed` — now-removed features
   - `Fixed` — bug fixes
   - `Security` — vulnerability fixes

1. **Write entries:**

   - One bullet per logical change, not per file.
   - Lead with the affected package/module/file when the project
     organises that way (match existing entries).
   - State what changed and, where non-obvious, why.
   - Wrap lines at ~80 chars, continuation lines indented two spaces.
   - Use backticks for identifiers, paths, env vars, flags.

1. **Insert** the new version block directly below the preamble and
   above the previous most-recent version. Use today's date
   (`YYYY-MM-DD`).

1. **Show the diff** of `CHANGELOG.md` to the user. Do not commit.

## Template

When creating a new `CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [X.Y.Z] — YYYY-MM-DD

### Added

- ...
```

## Style notes

- Match the existing changelog's punctuation (em-dash `—` vs hyphen `-`
  between version and date) exactly. Don't normalise.
- Don't include commit hashes, PR numbers, or author names unless the
  existing changelog already does.
- Don't describe internal refactors that have no observable effect
  unless the project's changelog already records them.
- Don't add a `[Unreleased]` section unless the project already uses
  one.
