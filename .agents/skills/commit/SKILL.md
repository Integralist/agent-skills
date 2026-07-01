---
name: commit
description: >-
  Create git commits with intelligent file grouping. Use when
  committing changes or drafting a commit message.
allowed-tools: Bash(git add:*), Bash(git diff:*), Bash(git commit:*)
---

# Commit

## Context

If the fields below show commands rather than output, run each one first.

- Status: !`git status 2>/dev/null || echo "(not a git repo)"`
- Staged: !`git diff --cached 2>/dev/null || echo "(not a git repo)"`
- Unstaged: !`git diff 2>/dev/null || echo "(not a git repo)"`
- Recent commits: !`git log -5 --oneline 2>/dev/null || echo "(not a git repo)"`
- Branch: !`git branch --show-current 2>/dev/null || echo "(not a git repo)"`
- File stats: !`git diff --stat HEAD 2>/dev/null || git diff --stat --cached 2>/dev/null || echo "(not a git repo)"`

## Process

1. **Review context above:**

   - Check for merge conflicts, large files, sensitive file names
     (`.env`, `.env.*`, `*.env`, `*secret*`, `*credential*`, `*.key`).
   - Scan diff content for hardcoded secrets: API keys, tokens,
     passwords, connection strings.
   - For untracked files (from `git status --porcelain`), use
     `git add -N <file>` then `git diff` to scan their contents for the
     same secrets.
   - **If on main or master branch: STOP. Warn the user and wait for
     explicit confirmation before committing. No exceptions.**

1. **Assess staging state:**

   - If files are already staged, list them and ask whether to commit
     only those or include unstaged changes.
   - If nothing is staged, analyze all unstaged changes.
   - Never silently add files on top of an existing partial stage.

1. **Analyze files for grouping:**

   - Purpose: config, docs, source, tests, scripts, assets.
   - Relationships: files that reference each other; same module/feature.
   - Change types: new files, modifications, renames.

1. **Decide on commits:**

   ```txt
   All files single purpose → one commit, no prompt
   Files split into obvious groups → sequential commits, no prompt
   Grouping ambiguous → prompt with 2-3 options
   ```

1. **If grouping is ambiguous, present numbered options and wait for the
   user's response:**

   - Option 1: All in one commit (describe contents).
   - Option 2: Suggested split (describe each group).
   - Option 3: One per file (only if ≤5 files).

1. **If splitting into multiple commits, order them so dependencies come
   first.** Type definitions before consumers. Shared utilities before
   features that import them. If ordering is unclear, ask.

1. **For each commit group:**

   - If splitting into multiple commits, unstage everything first:
     `git reset --quiet` (skip this if committing only what the user
     already staged).

   - Stage specific files: `git add <file1> <file2>` (never `-A` or `.`).

   - Verify staged: `git diff --cached --name-only`.

   - Write the commit message to a temp file with your file-writing tool
     (NOT a shell heredoc), then commit from that file:

     ```bash
     git commit -F /tmp/commit-msg.txt
     ```

     Do NOT pipe the message via a heredoc (`git commit -F - <<'EOF'`).
     `git commit -F -` reads stdin until the closing delimiter appears
     alone at column 0; if the shell receives it indented, with trailing
     whitespace, or without a final newline, git never sees the terminator
     and blocks on stdin forever — the call then hangs until it times out
     with no error. Writing a real file sidesteps stdin, heredocs, and
     shell escaping entirely.

   - If any `git commit` call hasn't returned within a few seconds, assume
     it is blocked reading stdin. Do not wait for the timeout — the message
     never reached git. Re-run using the temp-file form above.

1. **If pre-commit hook modifies files:** review the changes. Only amend
   if they're mechanical (formatting, linting). If substantive or unclear,
   ask before amending.

1. **Update project plan:** If you have been working against a project
   plan (a plan file, task list, or checklist in the conversation or
   filesystem), mark the corresponding task done. Match the plan's
   existing format: `[x]` for Markdown checklists, ✅ for emoji markers, or
   whatever convention the document uses.

## Agent Context Files

Skip these from commits unless the user explicitly asks to include them:
`.claude/`, `.cursorrules`, `.cursorignore`,
`.github/copilot-instructions.md`, `.windsurfrules`, `.clinerules`,
`.gemini/`, `.codex/`, `.omp/`, `.pi/`

## Project Plan Documents

Plan documents (`docs/plans/*.md`) need special handling:

- **Not started** (no `[x]` checkboxes): commit freely — it's a new plan
  being checked in.
- **In progress** (some tasks done, implementation incomplete): do NOT
  commit. Half-finished plans are working state, not a checkpoint. Skip
  the file and note it was excluded.
- **Completed** (implementation tasks done — remaining unchecked items are
  post-deploy/operational only): update the plan's `Status` field (e.g.
  `Planning` → `Complete`), then move it to `docs/plans/completed/` and
  commit. Create the directory if it doesn't exist. If unsure whether the
  plan qualifies as complete, ask.

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

- State what changed and why.
- Use counts: "3 files" not "several files".
- Active voice, specific language.
- Omit needless words — see
  [`../shared/CONCISE-PROSE.md`](../shared/CONCISE-PROSE.md).
- If `~/.gitcommit` exists, read it for the user's preferred
  commit-message conventions (type prefixes, scopes, subject style,
  examples) and follow them.

## Safety

- NEVER commit secrets (.env, credentials, keys, tokens, passwords,
  connection strings).
- NEVER skip hooks without user request.
- NEVER force operations without user consent.
