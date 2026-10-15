---
name: hunk
description: >-
  Interactive local and remote PR review with threaded replies to Hunk comments.
disable-model-invocation: true
argument-hint: >-
  [review | comments | done | branch | staged | <commit-sha> | PR #<num> |
  <owner/repo>#<num> | <pr-url>]
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

   For `/hunk done`, consider only sessions whose `repoRoot` or `cwd` matches
   the current working directory, even when only one session is live. If none
   match, report that there is no active review to finish and stop; do not
   launch Hunk or touch sessions in other repositories.

   Select the session using the rules below. Record its `sessionId` as
   `SESSION_ID` and its `repoRoot` (or `cwd`) as `SESSION_REPO`. Always pass
   `<SESSION_ID>` to subsequent `hunk session` commands so targeting still
   works after reloading onto a patch file.

   - **No active session:** Ask the user to run `hunk diff` in their terminal
     and wait for confirmation before continuing.
   - **Multiple active sessions:** Match the session whose `repoRoot` or `cwd`
     matches the current working directory; if still ambiguous, ask the user
     which window to drive.
   - **`daemon-build-mismatch` error:** Report which build is older (`daemon` vs
     `cli`) and how many windows are attached, then ask for confirmation before
     running `hunk daemon restart --yes`.

   For `/hunk done`, jump directly to Step 5's stop/cleanup branch, then stop.
   Skip comment processing and Steps 2–4; do not start another review.

   Before clearing notes or reloading, check for existing user comments:

   ```bash
   hunk session comment list "$SESSION_ID" --type user --json
   ```

   - **`/hunk comments`:** Keep the loaded target and all comment threads.
     Skip Steps 2–4 and run **Address user comments** below. If there are no
     user comments, report that and stop without changing the session.
   - **`/hunk` or `/hunk review` with existing user comments:** Keep the loaded
     target and all threads, including notes added before the agent started.
     Skip Step 2; inspect the changeset in Step 3, run **Address user comments**,
     then continue to Step 4 for any additional review findings.

   Completion criterion: `SESSION_ID` and `SESSION_REPO` are resolved, existing
   user comments are checked, and the correct workflow is selected.

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

4. **Publish inline notes and focus Stop 1.** Keep existing user notes and
   replies intact when adding findings. Apply findings or walkthrough stops in
   one batch with `--focus` so Hunk turns on agent notes and scrolls to the
   first note:

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
   - **User invokes `/hunk comments` or asks to check, reply to, or address
     their Hunk notes:** Run **Address user comments** below.
   - **User invokes `/hunk done` or finishes the review (`"stop"`, `"done"`,
     `"clear"`):**
     Clean up agent notes, highlights, and any temporary PR patch file, and
     restore the working-tree diff when a patch was loaded:
     ```bash
     hunk session comment clear "$SESSION_ID" --yes --json
     hunk session highlight clear "$SESSION_ID" --json
     rm -f "$SESSION_REPO/.git/hunk-review.patch"
     hunk session reload "$SESSION_ID" -- diff --watch --json
     ```

     Leave the Hunk TUI and shared daemon running. Report that the review is
     finished, then stop processing.

   Completion criterion: Every handled user note has a verified threaded
   reply, the view is refreshed, and navigation requests are handled; pending
   approvals or failures are reported, or the session is cleaned up on stop.

## Address user comments

Use this workflow both for pre-existing comments discovered on review entry
and for comments added during the review. A chat-only response does not count
as replying to a Hunk comment.

1. **Read the current view and complete threads.**

   ```bash
   hunk session get "$SESSION_ID" --json
   hunk session review "$SESSION_ID" --include-notes --json
   hunk session comment list "$SESSION_ID" --type all --json
   ```

   Record each user note's ID, anchor, body, and existing replies. Read the
   relevant code or patch before acting. Skip completed edits and fully
   answered questions unless the user asks to revisit them. Approval requests,
   blockers, and clarification questions remain pending until resolved.

   Record the current reload arguments in a Bash array `RELOAD_ARGS`: source
   options, `--`, review command, refs, flags, and pathspecs. Recover these
   from session details and known session history; consult the version-matched
   CLI reference if needed. If the target is still ambiguous, ask rather than
   guessing. Preserve the loaded target, source, filters, and threads.

2. **Act on each pending note and always reply under it.**

   - **Question or discussion:** Answer the actual question inline.
   - **Requested local edit:** Follow code-edit approval rules, make the
     approved change in the matching checkout, and run relevant checks. Reply
     with what changed and the verification result; distinguish untested work.
   - **Blocked, declined, unclear, or awaiting approval:** Reply with the
     reason or clarification needed. Do not silently skip the note or claim
     completion. For remote PRs, do not edit an unrelated local checkout.

   Post the outcome under the original note, including when no code changed:

   ```bash
   hunk session comment add "$SESSION_ID" --reply-to "<note-id>" \
     --summary "<answer, completed change, or blocker>" \
     --rationale "<supporting detail or checks, if needed>" --focus --json
   ```

3. **Explicitly refresh the same view and verify replies.** After the batch,
   including question-only replies or before pausing for approval, replay the
   recorded arguments without clearing comments:

   ```bash
   hunk session reload "$SESSION_ID" --json "${RELOAD_ARGS[@]}"
   hunk session review "$SESSION_ID" --include-notes --json
   hunk session comment list "$SESSION_ID" --type all --json
   ```

   Watch mode alone is not completion. Confirm the target is unchanged and
   every handled note still has its reply, then focus the relevant reply with
   `hunk session navigate "$SESSION_ID" --comment "<reply-id>" --json`.
   If a reply, refresh, or anchor fails, report the failure in chat and retain
   the note IDs and reply text for retry; do not report the batch as complete.

   Completion criterion: Every pending note has an inline answer, verified
   change confirmation, or explicit blocker; the same view has refreshed and
   replies remain visible, or the exact failure is reported.

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
| Inspect current source | `hunk session get <id> --json` |
| Read complete comment threads | `hunk session comment list <id> --type all --json` |
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
