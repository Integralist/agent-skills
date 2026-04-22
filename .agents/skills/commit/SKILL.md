---
name: commit
description: >-
  Create git commits with intelligent file grouping. Use when
  committing changes.
---

# Commit

## Context

If the fields below show commands rather than output, run each
one first.

- Status: !`git status 2>/dev/null || echo "(not a git repo)"`
- Staged: !`git diff --cached 2>/dev/null || echo "(not a git repo)"`
- Unstaged: !`git diff 2>/dev/null || echo "(not a git repo)"`
- Recent commits: !`git log -5 --oneline 2>/dev/null || echo "(not a git repo)"`
- Branch: !`git branch --show-current 2>/dev/null || echo "(not a git repo)"`
- File stats: !`git diff --stat HEAD 2>/dev/null || git diff --stat --cached 2>/dev/null || echo "(not a git repo)"`

## Process

1. **Review context above:**
   - Check for: merge conflicts, large files,
     sensitive file names (`.env`, `.env.*`, `*.env`, `*secret*`,
     `*credential*`, `*.key`)
   - Scan diff content for hardcoded secrets: API keys, tokens,
     passwords, connection strings
   - For untracked files (from `git status --porcelain`), use
     `git add -N <file>` then `git diff` to scan their contents
     for the same secrets
   - **If on main or master branch: STOP. Warn the user and wait
     for explicit confirmation before committing. No exceptions.**

2. **Assess staging state:**
   - If files are already staged, list them and ask whether to
     commit only those or include unstaged changes
   - If nothing is staged, proceed to analysis of all unstaged
     changes
   - Never silently add files on top of an existing partial stage

3. **Analyze files for grouping:**
   - Identify file purposes: config, docs, source, tests,
     scripts, assets
   - Identify relationships: files that reference each other,
     same module/feature
   - Identify change types: new files, modifications, renames

4. **Decide on commits:**

   ```txt
   All files single purpose → one commit, no prompt
   Files split into obvious groups → sequential commits, no prompt
   Grouping ambiguous → prompt with 2-3 options
   ```

5. **If grouping is ambiguous, present numbered options and wait
   for the user's response:**
   - Option 1: All in one commit (describe contents)
   - Option 2: Suggested split (describe each group)
   - Option 3: One per file (only if ≤5 files)

6. **If splitting into multiple commits, order them so
   dependencies come first.** Type definitions before consumers.
   Shared utilities before features that import them. If ordering
   is unclear, ask.

7. **For each commit group:**
   - If splitting into multiple commits, unstage everything
     first: `git reset --quiet` (skip this if committing only
     what the user already staged)
   - Stage specific files: `git add <file1> <file2>` (never
     `-A` or `.`)
   - Verify staged: `git diff --cached --name-only`
   - Commit via stdin to avoid shell escaping issues:

     ```bash
     git commit -F - <<'COMMIT_MSG'
     Subject line

     Optional body.
     COMMIT_MSG
     ```

8. **If pre-commit hook modifies files:** review the changes.
   Only amend if they're mechanical (formatting, linting). If
   substantive or unclear, ask before amending.

9. **Update project plan:** If you have been working against a
   project plan (e.g. a plan file, task list, or checklist in the
   conversation or filesystem), mark the task or item that
   corresponds to the committed change as done. Match the plan's
   existing format: `[x]` for Markdown checklists, ✅ for emoji
   markers, or whatever convention the document uses.

## Agent Context Files

Skip these from commits unless the user explicitly asks to
include them: `.claude/`, `.cursorrules`, `.cursorignore`,
`.github/copilot-instructions.md`, `.windsurfrules`,
`.clinerules`, `.gemini/`, `.codex/`, `.omp/`, `.pi/`

## Grouping Examples

**Clear single purpose (no prompt):**

- 3 test files → one commit
- README + docs/ files → one commit
- Single feature's source files → one commit

**Obvious split (no prompt, sequential commits):**

- Source files + their tests → 2 commits
- Config + docs + implementation → 3 commits
- Core feature + supporting utilities → 2 commits

**Ambiguous (prompt):**

- Mixed docs, config, and source with unclear boundaries
- Files that could logically go in multiple groups
- Large change set with no obvious structure

## Commit Message Style

- State what changed and why
- Use counts: "3 files" not "several files"
- Active voice, specific language

## Safety

- NEVER commit secrets (.env, credentials, keys, tokens,
  passwords, connection strings)
- NEVER skip hooks without user request
- NEVER force operations without user consent
