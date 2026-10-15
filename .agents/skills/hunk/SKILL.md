---
name: hunk
description: >-
  Interactive local and remote PR code review in a live Hunk TUI session.
disable-model-invocation: true
argument-hint: >-
  [review | branch | staged | <commit-sha> | PR #<num> | <owner/repo>#<num> | <pr-url>]
metadata:
  model-tier: complex
---

# Hunk Interactive Code Review

Drive a live Hunk TUI window (`hunk diff`) through `hunk session` CLI commands
to review local changes or remote GitHub pull requests, leave inline review
notes, highlight character spans, and answer user notes in a back-and-forth
loop.

> [!IMPORTANT]
> Never run interactive TUI commands (`hunk diff`, `hunk show`, `hunk gh`,
> `hunk patch`, `hunk open`) directly in the agent shell. The user owns the TUI
> window; control it exclusively with `hunk session *`.

## Process

1. **Locate the live Hunk session.** Run:

   ```bash
   hunk session list --json
   ```

   Record `SESSION_ID` (`sessions[0].sessionId`) and `SESSION_REPO`
   (`sessions[0].repoRoot` or `sessions[0].cwd`). Always pass `<SESSION_ID>` to
   subsequent `hunk session` commands so targeting still works after reloading
   onto a patch file.

   - **No active session:** Ask the user to run `hunk diff` in their terminal
     and wait for confirmation before continuing.
   - **Multiple active sessions:** Match the session whose `repoRoot` or `cwd`
     matches the current working directory; if still ambiguous, ask the user
     which window to drive.
   - **`daemon-build-mismatch` error:** Report which build is older (`daemon` vs
     `cli`) and how many windows are attached, then ask for confirmation before
     running `hunk daemon restart --yes`.

   Completion criterion: `SESSION_ID` and `SESSION_REPO` are resolved from a
   live Hunk session.

2. **Resolve the requested review target and reload the window.** Clear any
   stale agent notes and highlights from an earlier review before switching
   targets:

   ```bash
   hunk session comment clear "$SESSION_ID" --yes --json
   hunk session highlight clear "$SESSION_ID" --json
   ```

   Route by the user's argument:

   - **Uncommitted changes** (`/hunk`, `/hunk review`, `/hunk uncommitted`):
     ```bash
     hunk session reload "$SESSION_ID" -- diff --watch
     ```
     Add `--exclude-untracked` when the user asks for tracked changes only.

   - **Staged changes** (`/hunk staged`):
     ```bash
     hunk session reload "$SESSION_ID" -- diff --staged --watch
     ```

   - **Branch comparison** (`/hunk branch`, `/hunk review branch`, or
     `/hunk <base>...<head>`):
     Resolve `<base>` from the user's argument, or detect the default branch via
     `git symbolic-ref --quiet --short refs/remotes/origin/HEAD` (stripping
     `origin/`, fallback `main`), then reload:
     ```bash
     hunk session reload "$SESSION_ID" -- diff "<base>...HEAD" --watch
     ```

   - **Specific local commit** (`/hunk <commit-sha>` or `/hunk show <ref>`):
     ```bash
     hunk session reload "$SESSION_ID" -- show "<commit-sha>" --watch
     ```

   - **Remote GitHub PR** (`/hunk PR #123`, `/hunk #123`,
     `/hunk owner/repo#123`, or `/hunk <pr-url>`):
     Follow **Remote PR loading** below.

   Completion criterion: `hunk session reload` succeeds and the target changeset
   is active in `SESSION_ID`.

3. **Inspect the loaded changeset.** Fetch the file and hunk structure without
   inflating context:

   ```bash
   hunk session review "$SESSION_ID" --json
   ```

   Record each file's `path` and `hunks[].newRange` / `hunks[].oldRange`.
   - For **local reviews** (or same-repo PRs), read changed files and callers
     from disk to verify behavior, edge cases, and contracts.
   - For **cross-repo PRs** loaded via `.git/hunk-review.patch`, read the patch
     from `"$SESSION_REPO/.git/hunk-review.patch"` (or run
     `hunk session review "$SESSION_ID" --include-patch --json`) and fetch any
     needed surrounding file context with `gh api`.

   Completion criterion: Every changed file's hunk line ranges are known and
   the changeset has been analyzed.

4. **Publish inline notes and focus Stop 1.** Apply findings or walkthrough
   stops in one batch with `--focus` so Hunk turns on agent notes and scrolls
   to the first note:

   ```bash
   cat <<'EOF' | hunk session comment apply "$SESSION_ID" --stdin --focus --json
   {
     "comments": [
       {
         "filePath": "path/to/file.go",
         "newLine": 42,
         "summary": "Headline finding or walkthrough stop",
         "rationale": "Concise explanation or concrete fix."
       }
     ]
   }
   EOF
   ```

   Every `newLine` or `oldLine` target **must** fall inside a hunk range
   returned by `hunk session review "$SESSION_ID" --json` (or target by 1-based
   `"hunk": <n>`).

   Steer the user's eyes to the key expression on the first stop with an
   attention mark:

   ```bash
   hunk session navigate "$SESSION_ID" --file <path> --new-line <n> --json
   hunk session highlight add "$SESSION_ID" --file <path> --new-line <n> \
     --start <utf16-start> --end <utf16-end> --tone info --focus --json
   ```

   Present a concise overview in chat and state the immediate next step (for
   example, reply `"next"` for the next stop, or press `c` in Hunk to leave a
   note and tell the agent to read it).

   Completion criterion: Batch comments are applied, Stop 1 is focused and
   highlighted, and the chat summary is presented.

5. **Run the back-and-forth review loop.** Handle each user turn according to
   intent:

   - **User says `"next"` / `"prev"` or asks about another file/hunk:**
     Clear the previous highlight, navigate to the target hunk or comment, and
     highlight the new expression under discussion:
     ```bash
     hunk session highlight clear "$SESSION_ID" --json
     hunk session navigate "$SESSION_ID" --file <path> --new-line <n> --json
     hunk session highlight add "$SESSION_ID" --file <path> --new-line <n> \
       --start <s> --end <e> --tone current --focus --json
     ```
   - **User says they added notes in Hunk (`"check my notes"`, `"reply to my
     comments"`, `"address my notes"`):**
     Read human-authored notes:
     ```bash
     hunk session comment list "$SESSION_ID" --type user --json
     ```
     For each user note (`id`, `filePath`, `side`, `line`, `body`):
     - If it is a question or discussion point, reply directly under the user's
       card:
       ```bash
       hunk session comment add "$SESSION_ID" --reply-to "<note-id>" \
         --summary "<concise answer>" --rationale "<optional detail>" \
         --focus --json
       ```
     - If it requests a code change on a local branch/working tree, follow the
       session's code-edit approval rules, apply the edit on disk (watch mode
       refreshes Hunk automatically), and reply to `<note-id>` confirming the
       fix.
   - **User stops or finishes the review (`"stop"`, `"done"`, `"clear"`):**
     Clean up agent notes, highlights, and any temporary PR patch file, and
     restore the working-tree diff when a patch was loaded:
     ```bash
     hunk session comment clear "$SESSION_ID" --yes --json
     hunk session highlight clear "$SESSION_ID" --json
     rm -f "$SESSION_REPO/.git/hunk-review.patch"
     hunk session reload "$SESSION_ID" -- diff --watch --json
     ```

   Completion criterion: All user notes and navigation requests are resolved, or
   the session is cleaned up on stop.

## Remote PR loading

### 1. Repository confirmation gate

When the user asks to review a PR by number alone (for example,
`/hunk can you review PR #123` or `/hunk #123`) without specifying
`<owner>/<repo>` or a full GitHub PR URL:

1. Detect the current directory's GitHub repository from `origin`:
   ```bash
   git remote get-url origin
   ```
   Normalize it to `<current-owner>/<current-repo>`.
2. **Stop and prompt the user** before fetching any PR data:
   ```txt
   Which repository is PR #<number> in?
   1. <current-owner>/<current-repo> (current directory)
   2. Another repository — reply with owner/repo (e.g. integralist/dotfiles)
   ```
3. Wait for the user's response. Skip this prompt only when the user already
   provided `<owner>/<repo>#<number>` or a full GitHub PR URL.

### 2. Loading the PR into the live `hunk diff` window

Hunk's session reload sandbox (`reloadBounds`) requires any reloaded repo or
patch file to live inside `SESSION_REPO` (the repository root where `hunk diff`
started).

- **Same repository as `SESSION_REPO`:**
  Fetch the PR metadata, base branch, and PR head ref without modifying the
  checked-out branch or working tree, then reload Hunk onto the three-dot ref
  range:
  ```bash
  gh pr view <number> --repo "<owner>/<repo>" --json title,body,baseRefName,headRefOid,url
  git -C "$SESSION_REPO" fetch origin \
    "refs/heads/<baseRefName>:refs/remotes/origin/<baseRefName>" \
    "pull/<number>/head"
  hunk session reload "$SESSION_ID" -- diff "origin/<baseRefName>...FETCH_HEAD" --watch
  ```

- **Different repository from `SESSION_REPO` (e.g. `integralist/dotfiles` while
  `hunk diff` is running in `fastly/ai-assistant-api`):**
  Write the PR's unified diff into `"$SESSION_REPO/.git/hunk-review.patch"`
  (inside `.git/` so it stays inside `SESSION_REPO` bounds and never appears as
  an untracked file in `git status`), then reload the live Hunk window onto
  that patch file:
  ```bash
  gh pr view <number> --repo "<owner>/<repo>" --json title,body,baseRefName,headRefOid,url
  gh pr diff <number> --repo "<owner>/<repo>" > "$SESSION_REPO/.git/hunk-review.patch"
  hunk session reload "$SESSION_ID" -- patch "$SESSION_REPO/.git/hunk-review.patch" --watch
  ```

## Command reference

| Action | Command |
| :--- | :--- |
| List live sessions | `hunk session list --json` |
| Inspect session structure | `hunk session review <id> [--include-patch] [--include-notes] --json` |
| Check current focus | `hunk session context <id> --json` |
| Reload working tree | `hunk session reload <id> -- diff --watch` |
| Reload branch diff | `hunk session reload <id> -- diff <base>...HEAD --watch` |
| Reload commit | `hunk session reload <id> -- show <sha> --watch` |
| Reload patch file | `hunk session reload <id> -- patch <file-inside-repo> --watch` |
| Navigate to line/hunk | `hunk session navigate <id> --file <path> (--new-line <n> \| --old-line <n> \| --hunk <n>)` |
| Step between comments | `hunk session navigate <id> (--next-comment \| --prev-comment \| --comment <comment-id>)` |
| Add one comment | `hunk session comment add <id> --file <path> (--new-line <n> \| --old-line <n>) --summary <text> [--rationale <text>] [--focus]` |
| Reply to a note | `hunk session comment add <id> --reply-to <note-id> --summary <text> [--rationale <text>] [--focus]` |
| Batch-apply comments | `hunk session comment apply <id> --stdin [--focus] --json` |
| List user notes | `hunk session comment list <id> --type user --json` |
| Clear comments | `hunk session comment clear <id> [--file <path>] [--all] --yes` |
| Highlight range | `hunk session highlight add <id> --file <path> (--new-line <n> \| --old-line <n>) --start <s> --end <e> [--tone <match\|current\|info\|warning\|error\|dim>] [--focus]` |
| Clear highlights | `hunk session highlight clear <id> [--file <path>]` |

## Further reference

When a command flag, STML markup rule, or daemon error is not covered above,
consult in order:

1. Read the file at `hunk skill path` or run `hunk session <subcommand> --help`
   for offline, version-matched CLI behavior.
2. `https://hunk.dev/llms.txt` (page index; append `.md` to any docs URL) or
   `https://www.hunk.dev/llms-full.txt` for the complete Hunk documentation.
