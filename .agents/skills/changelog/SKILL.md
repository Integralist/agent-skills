---
name: changelog
description: >-
  Add an entry to the project's CHANGELOG.md from the uncommitted diff or the
  branch's changes against main. Use when the user asks to update the
  changelog, add a changelog entry, or record changes.
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(git rev-parse:*), Bash(git merge-base:*), Bash(git branch:*), Bash(date:*), Read, Edit, Write
metadata:
  model-tier: trivial
---

Add a [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) entry to
the repository-root `CHANGELOG.md`. Show the resulting diff; do not commit.

1. **Choose the source.** Run `git status --short`. If there are uncommitted
   changes, staged or not, use `git diff HEAD`. Otherwise compare the branch
   with `main`, or `master` if `main` does not exist:
   `git diff $(git merge-base HEAD <base>)...HEAD`. Read
   `git log <merge-base>..HEAD` for context. If both sources are empty, tell
   the user there is nothing to record and stop. Read the full diff, not only
   its stat, before categorizing.
2. **Match the changelog.** If `CHANGELOG.md` exists, note its heading depth,
   version scheme, per-package subheadings, and separator between version and
   date. If absent, create it from the template below, starting at `0.0.1`
   unless the user, tags, or a manifest such as `package.json` or
   `Cargo.toml` suggests another version.
3. **Choose a version.** Bump the latest heading by SemVer: patch for `Fixed`
   only; minor for `Added` or non-breaking `Changed`; major for breaking
   `Changed` or `Removed`. Before 1.0 (`0.x.y`), bump the patch for everything
   unless the user says otherwise. Ask if unsure.
4. **Write the entry.** Use today's date from `date +%Y-%m-%d`. Insert it
   directly below the preamble and above the previous version. Use sections
   `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security`, in
   that order, omitting empty sections.
5. **Show the diff** of `CHANGELOG.md`.

## Entry style

Write one bullet per logical change, not per file. If the changelog is
organized by package, module, or file, lead with that name. State what changed
and why when it is not obvious; omit needless words according to
[CONCISE-PROSE.md](../shared/CONCISE-PROSE.md). Wrap at about 80 characters,
indent continuation lines by two spaces, and put identifiers, paths, env vars,
and flags in backticks.

Match existing punctuation exactly, including the separator between version
and date. Include commit hashes, PR numbers, author names, refactors with no
observable effect, or an `[Unreleased]` section only when the existing
changelog already uses them.

Use this template when creating a changelog:

````md
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [X.Y.Z] — YYYY-MM-DD

### Added

- ...
````
