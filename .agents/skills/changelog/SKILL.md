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

# Changelog

Add a [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) entry to
the repo's root `CHANGELOG.md`, then show the diff without committing.

1. **Pick the source.** Run `git status --short`. With uncommitted changes,
   staged or not, use `git diff HEAD`. Otherwise diff the branch against
   `main`, or `master` if there's no main:
   `git diff $(git merge-base HEAD <base>)...HEAD`, reading
   `git log <merge-base>..HEAD` for hints. If both are empty, tell the user
   there's nothing to record and stop. Done when you've read the full diff,
   not just the stat, since categorising needs the hunks.
2. **Open the changelog.** If `CHANGELOG.md` exists, note its style: heading
   depth, version scheme, per-package subheadings, and the dash between
   version and date. If not, create it from the template, starting at
   `0.0.1` unless the user, tags, or a manifest such as `package.json` or
   `Cargo.toml` suggests otherwise. Done when you know the style to match.
3. **Pick the version** by bumping the latest heading per SemVer: patch for
   `Fixed` only, minor for `Added` or non-breaking `Changed`, major for a
   breaking `Changed` or `Removed`. Before 1.0 (`0.x.y`), bump the patch for
   everything unless the user says otherwise. Ask if unsure. Done when the
   version is settled.
4. **Write the entry** with today's date (`date +%Y-%m-%d`), directly below
   the preamble and above the previous version. Use the sections `Added`,
   `Changed`, `Deprecated`, `Removed`, `Fixed`, and `Security`, in that order,
   leaving out empty ones. Done when the block is inserted.
5. **Show the diff** of `CHANGELOG.md`. Done when the user has seen it.

**Entries.** One bullet per logical change, not per file, leading with the
affected package, module, or file when the changelog is organised that way.
State what changed and, where it isn't obvious, why, omitting needless words
per [CONCISE-PROSE.md](../shared/CONCISE-PROSE.md). Wrap at about 80
characters with continuation lines indented two spaces, and put identifiers,
paths, env vars, and flags in backticks.

**Match the existing changelog.** Copy its punctuation exactly, such as `—`
or `-` between version and date. Add commit hashes, PR numbers, author names,
refactors with no observable effect, or an `[Unreleased]` section only when
it already has them.

````md
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [X.Y.Z] — YYYY-MM-DD

### Added

- ...
````
